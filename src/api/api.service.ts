/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ApiService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async getToken(request: any) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: request.email, deletedAt: null },
        include: {
          role: {
            include: {
              permission: {
                include: {
                  permission: true,
                },
              },
            },
          },
          operator: true,
        },
      });
      if (!user) {
        return {
          code: 401,
          message: 'Credentials incorrect',
        };
      }
      const isPasswordValid = await bcrypt.compare(
        request.password,
        user.password,
      );
      if (isPasswordValid) {
        const payload = { sub: user.id, email: user.email };
        const expiresInDays = 1000;
        const token = this.jwt.sign(payload, {
          expiresIn: `${expiresInDays}d`,
        });
        return {
          code: 200,
          message: 'Successfully',
          token: token,
        };
      } else {
        return {
          code: 401,
          message: 'Unauthorized',
        };
      }
    } catch (error) {
      console.error('error:', error);
      return this.globalService.response('Internal Server Error', {}, 500);
    }
  }

  async dataSdPairs() {
    try {
      const routePair = await this.prisma.routePair.findMany({
        where: {
          deletedAt: null,
        },
        include: { departure: true, arrival: true },
      });
      const Sdpairs = [];
      for (let i = 0; i < routePair.length; i++) {
        Sdpairs.push({
          sourceId: String(routePair[i].departure.idOTA),
          sourceName: routePair[i].departure.name,
          destinationId: String(routePair[i].arrival.idOTA),
          destinationName: routePair[i].arrival.name,
        });
      }
      return {
        Result: 'SUCCESS',
        SDPairs: Sdpairs,
      };
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async listTrip(request: any) {
    try {
      const whereConditions = {
        deletedAt: null,
      };
      if (request.source) {
        whereConditions['departure'] = {
          idOTA: parseInt(request.source),
        };
      }
      if (request.destination) {
        whereConditions['arrival'] = {
          idOTA: parseInt(request.destination),
        };
      }
      if (request.doj) whereConditions['date'] = request.doj;
      const datas = await this.prisma.trips.findMany({
        where: whereConditions,
        orderBy: {
          sort: 'asc',
        },
        include: {
          vehicle: {
            include: {
              operatorData: true,
              typeData: true,
            },
          },
          driver: true,
          departure: true,
          arrival: true,
          route: {
            include: {
              RoutePoint: {
                include: {
                  point: true,
                },
              },
            },
          },
          TripPoint: {
            include: {
              point: true,
              trip: true,
            },
          },
          TripSeat: true,
        },
      });
      const result = await Promise.all(
        datas.map(async (trip) => {
          const route = await this.prisma.routePair.findFirst({
            where: { departureId: trip.departureId, arrivalId: trip.arivalId },
          });
          const boardingTimes = trip.TripPoint.map((tp) => {
            return {
              bpId: tp.point.idOTA,
              bpName: tp.point.name,
              time: tp.trip.date + ' ' + tp.departureTime + ':00',
              address: tp.point.address,
              contactNumber: '-',
              landmark: '-',
              latitude: tp.point.lat,
              longitude: tp.point.long,
            };
          });
          const droppingTimes = trip.TripPoint.map((tp) => {
            return {
              bpId: tp.point.idOTA,
              bpName: tp.point.name,
              time: tp.trip.date + ' ' + tp.departureTime + ':00',
              landmark: '-',
              latitude: tp.point.lat,
              longitude: tp.point.long,
            };
          });
          const fareDetails = trip.TripPoint.map((tp) => {
            return {
              seater: tp.trip.basePrice,
            };
          });
          const fares = trip.TripPoint.map((tp) => {
            return tp.trip.basePrice;
          });
          return {
            id: trip.idOTA,
            vehicleType:
              trip.seatCapacity == 8
                ? trip.vehicle.typeData.name + '(1+1)'
                : trip.vehicle.typeData.name + '(2+1)',
            busType: trip.seatCapacity == 8 ? 'Executive' : 'Regular',
            operator: trip.vehicle.operatorData.name,
            routeId: route?.idOTA,
            doj: trip.date,
            departureTime: trip.date + ' ' + trip.departureTime + ':00',
            arrivalTime: trip.date + ' ' + trip.arrivalTime + ':00',
            boardingTimes: boardingTimes,
            droppingTimes: droppingTimes,
            availableSeats: trip.TripSeat.filter(
              (seat) => seat.status == 'AVAILABLE',
            ).length,
            fares: fares,
            fareDetails: fareDetails,
            cancellationPolicy: '0:12:100:0;12:24:50:0;24:-1:10:0',
            ReschedulePolicy: '12:-1:50:0',
            source: trip.departure.idOTA,
            destination: trip.arrival.idOTA,
            bookable: true,
            maxSeatsPerTicket: 4,
          };
        }),
      );
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
