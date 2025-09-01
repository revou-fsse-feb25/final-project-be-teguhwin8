/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { contains } from '@nestjs/class-validator';
import axios from 'axios';

@Injectable()
export class TripService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async generate(request: any) {
    try {
      if (!request.startDate || !request.day || !request.routeId) {
        throw new Error('Missing required fields: startDate, day, or routeId');
      }
      request.startDate = new Date(request.startDate);
      if (isNaN(request.startDate.getTime())) {
        throw new Error('Invalid startDate format');
      }
      const result = [];
      const start = new Date(request.startDate);
      for (let i = 0; i <= request.day; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dayName = currentDate
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const schedule = await this.prisma.schedules.findFirst({
          where: {
            routeId: request.routeId,
            days: dayName,
            isActive: true,
          },
          include: {
            vehicle: {
              include: {
                vehicleSeat: true,
              },
            },
            route: true,
            ScheduleTemplate: {
              where: { isSale: true },
              include: {
                driver: true,
                ScheduleTemplatePoint: {
                  orderBy: { sort: 'asc' },
                  include: { point: true },
                },
              },
            },
          },
        });
        if (schedule && schedule.ScheduleTemplate.length > 0) {
          let codeSPJTrue: string | null = null;
          let codeSPJFalse: string | null = null;
          const hasTrue = schedule.ScheduleTemplate.some(
            (t) => t.isRound === true,
          );
          const hasFalse = schedule.ScheduleTemplate.some(
            (t) => t.isRound === false,
          );
          if (hasTrue)
            codeSPJTrue = await this.globalService.generateSPJCode(this.prisma);
          if (hasFalse)
            codeSPJFalse = await this.globalService.generateSPJCode(
              this.prisma,
            );

          for (const template of schedule.ScheduleTemplate) {
            const departurePoint = template.ScheduleTemplatePoint.find(
              (pt) => pt.pointId === template.pointDepartureId,
            );
            const arrivalPoint = template.ScheduleTemplatePoint.find(
              (pt) => pt.pointId === template.pointArrivalId,
            );
            const seatCapacity = schedule.vehicle.vehicleSeat.length;
            const departureTime = departurePoint?.departureTime || '';
            const arrivalTime = arrivalPoint?.departureTime || '';
            let duration = 0;
            if (departureTime && arrivalTime) {
              const depParts = departureTime.split(':').map(Number);
              const arrParts = arrivalTime.split(':').map(Number);
              const depHour = depParts[0] || 0;
              const depMin = depParts[1] || 0;
              const depSec = depParts[2] || 0;
              const arrHour = arrParts[0] || 0;
              const arrMin = arrParts[1] || 0;
              const arrSec = arrParts[2] || 0;
              let depDate = new Date(2000, 0, 1, depHour, depMin, depSec);
              let arrDate = new Date(2000, 0, 1, arrHour, arrMin, arrSec);
              if (arrDate <= depDate) {
                arrDate.setDate(arrDate.getDate() + 1);
              }
              const diffMs = arrDate.getTime() - depDate.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);
              duration = Math.ceil(diffHours); // dibulatkan ke atas
            }
            const sort = schedule.ScheduleTemplate.indexOf(template) + 1;
            let codeSPJ: string | null = null;
            if (template.isRound === true) {
              codeSPJ = codeSPJTrue;
            } else {
              codeSPJ = codeSPJFalse;
            }
            const trip = await this.prisma.trips.create({
              data: {
                vehicleId: schedule.vehicleId,
                driverId: template.driverId,
                routeId: schedule.routeId,
                code: await this.globalService.generateTripCode(this.prisma),
                codeSPJ: codeSPJ,
                date: dateStr,
                departureId: departurePoint?.point?.id || '',
                departureCity: departurePoint?.point?.city || '',
                departureCode: departurePoint?.point?.pointCode || '',
                departureName: departurePoint?.point?.name || '',
                arivalId: arrivalPoint?.point?.id || '',
                arivalCity: arrivalPoint?.point?.city || '',
                arivalCode: arrivalPoint?.point?.pointCode || '',
                arivalName: arrivalPoint?.point?.name || '',
                driverCode: template.driver?.code || '',
                driverName: template.driver?.name || '',
                vehicleLicense: schedule.vehicle.licensePlate || '',
                vehicleName: schedule.vehicle.name || '',
                feeDriver: schedule.route.feeDriver,
                feeToll: schedule.route.feeToll,
                feeFuel: schedule.route.feeFuel,
                feeOther: schedule.route.feeOther,
                feeTotal:
                  schedule.route.feeDriver +
                  schedule.route.feeToll +
                  schedule.route.feeFuel +
                  schedule.route.feeOther,
                departureTime: departureTime,
                arrivalTime: arrivalTime,
                up1Price: 0,
                up2Price: 0,
                basePrice: template?.price || 0,
                down1Price: 0,
                down2Price: 0,
                discount: 0,
                status: 'PENDING',
                duration: duration,
                departureTimeActual: departureTime,
                sort: sort,
                seatCapacity: seatCapacity,
                isRound: template.isRound,
              },
            });
            for (const seat of schedule.vehicle.vehicleSeat) {
              await this.prisma.tripSeat.create({
                data: {
                  tripId: trip.id,
                  code: seat.code,
                  row: seat.row,
                  column: seat.column,
                },
              });
            }
            for (const pt of template.ScheduleTemplatePoint) {
              await this.prisma.tripPoint.create({
                data: {
                  tripId: trip.id,
                  routeId: schedule.routeId,
                  pointId: pt.pointId,
                  departureTime: pt.departureTime,
                  arrivalTime: '',
                },
              });
            }
            result.push(trip);
          }
        }
      }
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async list(request: any) {
    try {
      const whereConditions = {
        deletedAt: null,
      };
      if (request.departureId) {
        whereConditions['departureId'] = {
          in: request.departureId,
        };
      }
      if (request.arivalId) {
        whereConditions['arivalId'] = {
          in: request.arivalId,
        };
      }
      if (request.date) {
        whereConditions['date'] = {
          contains: request.date,
        };
      }
      whereConditions['status'] = {
        not: 'CANCELLED',
      };
      const datas = await this.prisma.trips.findMany({
        where: whereConditions,
        include: {
          vehicle: true,
          driver: true,
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
            },
          },
          TripSeat: true,
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async getData(id: string) {
    try {
      const datas = await this.prisma.trips.findFirst({
        where: {
          id,
        },
        include: {
          vehicle: true,
          driver: true,
          route: true,
          TripPoint: {
            include: {
              point: true,
            },
          },
          TripSeat: true,
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async create(request: any) {
    try {
      const data = await this.prisma.trips.create({
        data: {
          vehicleId: request.vehicleId,
          driverId: request.driverId,
          routeId: request.routeId,
          code:
            request.code ||
            (await this.globalService.generateTripCode(this.prisma)),
          codeSPJ: await this.globalService.generateSPJCode(this.prisma),
          date: request.date,
          departureCode: request.departureCode,
          departureName: request.departureName,
          arivalId: request.arivalId,
          arivalCity: request.arivalCity,
          arivalCode: request.arivalCode,
          arivalName: request.arivalName,
          departureId: request.departureId,
          departureCity: request.departureCity,
          driverCode: request.driverCode,
          driverName: request.driverName,
          vehicleLicense: request.vehicleLicense,
          vehicleName: request.vehicleName,
          feeDriver: request.feeDriver,
          feeToll: request.feeToll,
          feeFuel: request.feeFuel,
          feeOther: request.feeOther,
          feeTotal: request.feeTotal,
          departureTime: request.departureTime,
          arrivalTime: request.arrivalTime,
          up1Price: request.up1Price,
          up2Price: request.up2Price,
          basePrice: request.basePrice,
          down1Price: request.down1Price,
          down2Price: request.down2Price,
          discount: request.discount,
        },
      });
      const result = await this.prisma.trips.findFirst({
        where: { id: data.id },
        include: {
          vehicle: true,
          driver: true,
          route: true,
        },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, request: any) {
    try {
      const trip = await this.prisma.trips.findFirst({
        where: { id, deletedAt: null },
      });
      if (!trip) {
        throw new Error(`Trip with ID ${id} not found or has been deleted`);
      }
      const { deletedAt, ...safeDto } = request as any;

      if (request.status === 'ONGOING') {
        const now = new Date();
        const jakarta = now.toLocaleString('en-US', {
          timeZone: 'Asia/Jakarta',
          hour12: false,
        });
        const [timeStr] = jakarta.split(', ');
        const [hh, mm] = timeStr.split(':');
        safeDto.departureTimeActual = `${hh}:${mm}`;
      }
      if (request.status === 'COMPLETED') {
        const now = new Date();
        const jakarta = now.toLocaleString('en-US', {
          timeZone: 'Asia/Jakarta',
          hour12: false,
        });
        const [timeStr] = jakarta.split(', ');
        const [hh, mm] = timeStr.split(':');
        safeDto.arrivalTimeActual = `${hh}:${mm}`;
      }

      const updated = await this.prisma.trips.update({
        where: { id },
        data: safeDto,
      });
      return this.globalService.response('Successfully', updated);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.trips.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully soft deleted', deleted);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async restore(id: string) {
    try {
      const restored = await this.prisma.trips.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(request: any) {
    try {
      let datas = [];
      const whereConditions = {
        deletedAt: null,
      };
      if (request.operator) {
        whereConditions['vehicle'] = {
          operator: request.operator,
        };
      }
      const vehicles = await this.prisma.vehicle.findMany({
        where: whereConditions,
        orderBy: {
          totalDistanceKiloMeter: 'desc',
        },
        include: {
          driverData: true,
          device: true,
          route: true,
          operatorData: true,
          typeData: true,
        },
      });
      if (vehicles.length > 0) {
        for (let index = 0; index < vehicles.length; index++) {
          const vehicle = vehicles[index];
          const todayStart = new Date(request.date);
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(request.date);
          todayEnd.setHours(23, 59, 59, 999);
          const logs = await this.prisma.deviceLogs.findMany({
            where: {
              ident: vehicle.deviceImei,
              createdAt: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
          });
          let totalDistance = logs.reduce((sum, log) => {
            const distance = parseInt(log.distance);
            return sum + (distance || 0);
          }, 0);
          const totalDistanceKm = (totalDistance / 1000).toFixed(2);
          datas.push({
            vehicle: vehicle,
            totalDistance: totalDistanceKm + ' km',
          });
        }
      }
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string, request: any) {
    try {
      let datas = [];
      const vehicles = await this.prisma.vehicle.findFirst({
        where: {
          id,
        },
        include: {
          driverData: true,
          device: true,
          route: true,
          operatorData: true,
          typeData: true,
        },
      });
      const vehicle = vehicles;
      const todayStart = new Date(request.date);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(request.date);
      todayEnd.setHours(23, 59, 59, 999);
      const logs = await this.prisma.deviceLogs.findMany({
        where: {
          ident: vehicle.deviceImei,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });
      let totalDistance = logs.reduce((sum, log) => {
        const distance = parseInt(log.distance);
        return sum + (distance || 0);
      }, 0);
      const totalDistanceKm = (totalDistance / 1000).toFixed(2);
      datas.push({
        vehicle: vehicle,
        totalDistance: totalDistanceKm + ' km',
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async setSeatAvailability(tripSeatIds: string[], isAvail: boolean) {
    try {
      if (!Array.isArray(tripSeatIds) || tripSeatIds.length === 0) {
        return this.globalService.response('No tripSeatIds provided!', {});
      }
      const updated = await this.prisma.tripSeat.updateMany({
        where: { id: { in: tripSeatIds } },
        data: { isAvail, status: 'ONHOLD' },
      });
      return this.globalService.response('Successfully', updated);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async updateScheduler(request: any) {
    try {
      if (!request.routeId || !request.date || !request.vehicleSeat) {
        return this.globalService.response(
          'routeId, date, and vehicleSeat are required!',
          {},
        );
      }
      if (request.vehicleId) {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: request.vehicleId },
        });
        await this.prisma.trips.updateMany({
          where: {
            routeId: request.routeId,
            date: request.date,
            seatCapacity: request.vehicleSeat,
          },
          data: {
            vehicleId: request.vehicleId,
            vehicleName: vehicle.name,
            vehicleLicense: vehicle.licensePlate,
          },
        });
      }
      if (request.driverId) {
        const driver = await this.prisma.driver.findUnique({
          where: { id: request.driverId },
        });
        await this.prisma.trips.updateMany({
          where: {
            routeId: request.routeId,
            date: request.date,
            seatCapacity: request.vehicleSeat,
          },
          data: {
            driverId: request.driverId,
            driverName: driver.name,
            driverCode: driver.code,
          },
        });
      }
      const datas = await this.prisma.trips.findMany({
        where: {
          routeId: request.routeId,
          date: request.date,
          seatCapacity: request.vehicleSeat,
        },
        orderBy: {
          sort: 'asc',
        },
        include: {
          vehicle: true,
          driver: true,
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
            },
          },
          TripSeat: true,
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async createReservation(request: any) {
    try {
      const totalPriceAfterDiscount = request.totalPrice || 0;
      const codeInvoice = await this.globalService.generateInvoiceCode(
        this.prisma,
      );
      let customer = await this.prisma.customer.findFirst({
        where: {
          user: { phoneNumber: request.contact.phoneNumber },
          deletedAt: null,
        },
        include: {
          user: true,
        },
      });
      if (!customer) {
        const user = await this.prisma.user.create({
          data: {
            phoneNumber: request.contact.phoneNumber,
            name: request.contact.name,
          },
        });
        await this.prisma.customer.create({
          data: {
            code: await this.globalService.generateCustomerCode(this.prisma),
            userId: user.id,
          },
        });
        customer = await this.prisma.customer.findFirst({
          where: {
            user: { phoneNumber: request.contact.phoneNumber },
            deletedAt: null,
          },
          include: {
            user: true,
          },
        });
      }
      const apiKey = process.env.KEYXENDIT;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      };
      const adminFee = 6500;
      const createInvoiceParams = {
        external_id: codeInvoice,
        amount: totalPriceAfterDiscount + adminFee,
        description: 'Payment for Order',
        invoice_duration: 1200,
        currency: 'IDR',
        success_redirect_url:
          'https://stg-travl.himovy.com/payment/payment-success',
        failure_redirect_url:
          'https://stg-travl.himovy.com/payment/payment-failed',
        customer: {
          given_names: customer.user.name || 'customer',
          surname: customer.user.name || 'customer',
          email: customer.user.email || 'git@hijaudigital.com',
          mobile_number: customer.user.phoneNumber || '081190046494',
          addresses: [
            {
              city: 'Jakarta',
              country: 'Indonesia',
              postal_code: '12345',
              state: customer.address || 'Jakarta',
              street_line1: '-- TRVL --',
              street_line2: '-- TRVL --',
            },
          ],
        },
        customer_notification_preference: {
          invoice_created: ['whatsapp', 'email'],
          invoice_reminder: ['whatsapp', 'email'],
          invoice_paid: ['whatsapp', 'email'],
          invoice_expired: ['whatsapp', 'email'],
        },
        fees: [
          {
            type: 'admin',
            value: 6500,
          },
        ],
      };
      const response = await axios.post(
        'https://api.xendit.co/v2/invoices',
        createInvoiceParams,
        { headers },
      );
      const xendit = response.data;
      const invoice = await this.prisma.invoice.create({
        data: {
          code: codeInvoice,
          customerId: customer.id,
          totalPrice: totalPriceAfterDiscount,
          date: new Date().toISOString().slice(0, 10),
          external_id: codeInvoice,
          status: request.status || 'PENDING',
          merchant_name: 'TRVL',
          amount: totalPriceAfterDiscount,
          payer_email: customer.user.email || 'git@hijaudigital.com',
          description: 'Payment for Order',
          success_redirect_url:
            'https://stg-travl.himovy.com/payment/payment-success',
          failure_redirect_url:
            'https://stg-travl.himovy.com/payment/payment-failed',
          url_payment: xendit.invoice_url,
          createdAt: request.createdAt ?? new Date(),
          updatedAt: request.updatedAt ?? new Date(),
          deletedAt: request.deletedAt ?? null,
        },
      });
      const order = await this.prisma.order.create({
        data: {
          code: await this.globalService.generateOrderCode(this.prisma),
          voucherId: request.voucherId || null,
          customerId: customer.id,
          invoiceId: invoice.id,
          tripId: request.tripId,
          date: new Date().toISOString().slice(0, 10),
          status: request.status,
          totalPrice: request.totalPrice || 0,
          discount: 0,
          subtotal: totalPriceAfterDiscount || 0,
          createdAt: request.createdAt ?? new Date(),
          updatedAt: request.updatedAt ?? new Date(),
          deletedAt: request.deletedAt ?? null,
        },
      });
      for (let index = 0; index < request.passenger.length; index++) {
        const item = request.passenger[index];
        const passengerCreate = await this.prisma.customerPassenger.create({
          data: {
            customerId: customer.id,
            name: item.name,
            phoneNumber: item.phoneNumber,
          },
        });
        const passenger = await this.prisma.customerPassenger.findUnique({
          where: { id: passengerCreate.id, deletedAt: null },
        });
        let itemDiscount = 0;
        let itemTotalPrice = item.price;
        await this.prisma.orderItem.create({
          data: {
            code: await this.globalService.generateOrderItemCode(this.prisma),
            orderId: order.id,
            tripSeatId: item.tripSeatId,
            name: passenger?.name || 'Unknown Passenger',
            address: passenger?.address || 'Unknown Address',
            phoneNumber: passenger?.phoneNumber || 'Unknown Phone',
            price: item.price,
            discount: itemDiscount,
            totalPrice: itemTotalPrice,
            createdAt: request.createdAt ?? new Date(),
            updatedAt: request.updatedAt ?? new Date(),
            deletedAt: request.deletedAt ?? null,
          },
        });
        await this.prisma.tripSeat.update({
          where: {
            id: item.tripSeatId,
          },
          data: {
            isAvail: false,
            status: 'ONHOLD',
          },
        });
      }
      const result = await this.prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          Order: {
            include: { OrderItem: true },
          },
        },
      });
      return this.globalService.response('Successfully created', result);
    } catch (error) {
      console.error('Create error:', error);
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async listScheduler(request: any) {
    try {
      const whereConditions = {
        deletedAt: null,
      };
      if (request.routeId) whereConditions['routeId'] = request.routeId;
      if (request.date) {
        whereConditions['date'] = {
          contains: request.date,
        };
      }
      if (request.isRound == 'true') whereConditions['isRound'] = true;
      if (request.isRound == 'false') whereConditions['isRound'] = false;
      if (request.seatCapacity)
        whereConditions['seatCapacity'] = parseInt(request.seatCapacity);
      const datas = await this.prisma.trips.findMany({
        where: whereConditions,
        include: {
          vehicle: true,
          driver: true,
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
            },
          },
          TripSeat: true,
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async listManifest(request: any) {
    try {
      const whereConditions = {
        deletedAt: null,
      };
      if (request.date) {
        whereConditions['date'] = {
          contains: request.date,
        };
      }
      if (request.routeId) whereConditions['routeId'] = request.routeId;
      if (request.isRound == 'true') whereConditions['isRound'] = true;
      if (request.isRound == 'false') whereConditions['isRound'] = false;
      if (request.seatCapacity)
        whereConditions['seatCapacity'] = parseInt(request.seatCapacity);
      if (request.departureTime)
        whereConditions['departureTime'] = request.departureTime;
      const datas = await this.prisma.trips.findMany({
        where: whereConditions,
        orderBy: {
          sort: 'asc',
        },
        include: {
          vehicle: true,
          driver: true,
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
            },
          },
          TripSeat: {
            include: {
              OrderItem: {
                include: {
                  order: {
                    include: {
                      invoice: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const result = datas.map((trip) => {
        const tripSeats = trip.TripSeat || [];
        const seatPending = tripSeats.filter(
          (seat) => seat.status === 'ONHOLD',
        ).length;
        const seatPaid = tripSeats.filter(
          (seat) => seat.status === 'PAID',
        ).length;
        const seatCheckIn = tripSeats.filter(
          (seat) => seat.status === 'CHECKIN',
        ).length;
        const seatBooked = tripSeats.filter(
          (seat) => seat.status !== 'AVAILABLE',
        ).length;
        const seatCapacity = tripSeats.length;
        return {
          ...trip,
          seatPending,
          seatPaid,
          seatCheckIn,
          seatBooked,
          seatCapacity,
        };
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async listReservation(request: any) {
    try {
      const whereConditions = {
        deletedAt: null,
      };
      if (request.date) {
        whereConditions['date'] = {
          contains: request.date,
        };
      }
      if (request.routeId) whereConditions['routeId'] = request.routeId;
      if (request.isRound == 'true') whereConditions['isRound'] = true;
      if (request.isRound == 'false') whereConditions['isRound'] = false;
      if (request.vehicleSeat)
        whereConditions['seatCapacity'] = request.vehicleSeat;
      if (request.departureTime)
        whereConditions['departureTime'] = request.departureTime;
      if (request.departureId)
        whereConditions['departureId'] = request.departureId;
      const datas = await this.prisma.trips.findMany({
        where: whereConditions,
        orderBy: {
          sort: 'asc',
        },
        include: {
          vehicle: true,
          driver: true,
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
            },
          },
          TripSeat: true,
        },
      });
      const result = datas.map((trip) => {
        const tripSeats = trip.TripSeat || [];
        const seatBooked = tripSeats.filter(
          (seat) => seat.status !== 'AVAILABLE',
        ).length;
        const seatCapacity = tripSeats.length;
        return {
          ...trip,
          seatBooked,
          seatCapacity,
        };
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async listPassenger(request: any) {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { user: { phoneNumber: request.phoneNumber } },
      });
      if (!customer) {
        return this.globalService.response('Customer not found', []);
      }
      let result = [];
      if (request.isHistory) {
        result = await this.prisma.order.findMany({
          where: {
            customerId: customer?.id,
            trip: { status: { in: ['CANCELLED', 'COMPLETED'] } },
          },
          include: {
            OrderItem: {
              include: {
                seat: true,
              },
            },
            trip: {
              include: {
                arrival: true,
                departure: true,
              },
            },
            customer: {
              include: {
                user: true,
              },
            },
          },
        });
        if (!result || result.length === 0) {
          return this.globalService.response('No active orders found', []);
        }
      } else {
        result = await this.prisma.order.findMany({
          where: {
            customerId: customer?.id,
            trip: { status: { in: ['ONGOING', 'PENDING'] } },
          },
          include: {
            OrderItem: {
              include: {
                seat: true,
              },
            },
            trip: {
              include: {
                arrival: true,
                departure: true,
              },
            },
            customer: {
              include: {
                user: true,
              },
            },
          },
        });
        if (!result || result.length === 0) {
          return this.globalService.response('No active orders found', []);
        }
      }
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async dataSPJ(request: any) {
    try {
      const trip = await this.prisma.trips.findFirst({
        where: { id: request.tripId },
      });
      if (!trip) {
        return this.globalService.response('Trip not found', []);
      }
      const tripDeparture = await this.prisma.trips.findFirst({
        where: {
          routeId: trip.routeId,
          date: trip.date,
          isRound: trip.isRound,
        },
        orderBy: { sort: 'asc' },
        include: {
          driver: true,
          vehicle: true,
        },
      });
      const tripArrival = await this.prisma.trips.findFirst({
        where: {
          routeId: trip.routeId,
          date: trip.date,
          isRound: trip.isRound,
        },
        orderBy: { sort: 'desc' },
      });
      const trips = await this.prisma.trips.findMany({
        where: {
          routeId: trip.routeId,
          date: trip.date,
          isRound: trip.isRound,
        },
        orderBy: { sort: 'asc' },
        select: { id: true, sort: true },
      });
      const tripIds = trips.map((t) => t.id);
      const tripSeats = await this.prisma.tripSeat.findMany({
        where: {
          tripId: { in: tripIds },
          OrderItem: {
            some: {
              order: {
                status: { in: ['PAID', 'CHECKIN'] },
              },
            },
          },
        },
        include: {
          OrderItem: {
            where: {
              order: {
                status: { in: ['PAID', 'CHECKIN'] },
              },
            },
            include: {
              order: true,
            },
          },
          trip: true,
        },
        orderBy: [{ trip: { sort: 'asc' } }, { code: 'asc' }],
      });

      const passenger = tripSeats.map((seat) => {
        const orderItem = seat.OrderItem[0];
        return {
          seatId: seat.id,
          code: seat.code,
          row: seat.row,
          column: seat.column,
          status: seat.status,
          orderItem: orderItem,
        };
      });

      const data = {
        code: trip.codeSPJ,
        departureDate: tripDeparture?.date,
        departureTime: tripDeparture?.departureTime,
        arrivalDate: tripArrival?.date,
        arrivalTime: tripArrival?.arrivalTime,
        driver: tripDeparture?.driver,
        vehicle: tripDeparture?.vehicle,
        departureCode: tripDeparture?.departureCode,
        departureName: tripDeparture?.departureName,
        departureCity: tripDeparture?.departureCity,
        arrivalCode: tripArrival?.arivalCode,
        arrivalName: tripArrival?.arivalName,
        arrivalCity: tripArrival?.arivalCity,
        passenger,
      };
      return this.globalService.response('Successfully', data);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async updateTripSeat(request: any) {
    try {
      const validate = await this.prisma.tripSeat.findFirst({
        where: { id: request.tripSeatId },
      });
      if (!validate) {
        return this.globalService.response('Trip Seat seat not found', []);
      }
      await this.prisma.tripSeat.update({
        where: {
          id: request.tripSeatId,
        },
        data: {
          status: request.status,
        },
      });
      if (request.status === 'CHECKIN' && validate.tripId) {
        const trip = await this.prisma.trips.findFirst({
          where: { id: validate.tripId },
        });
        await this.prisma.trips.update({
          where: { id: trip.id },
          data: { checkIn: trip.checkIn + 1 || 1 },
        });
      }
      const result = await this.prisma.tripSeat.findFirst({
        where: { id: request.tripSeatId },
        include: { trip: true, OrderItem: { include: { order: true } } },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
