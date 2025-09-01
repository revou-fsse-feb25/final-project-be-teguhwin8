/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail/mail.module';
import { EmailModule } from './email/email.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserDeviceModule } from './user-device/user-device.module';
import { OneSignalAppModule } from './one-signal-app/one-signal-app.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DeviceLogsModule } from './device-logs/device-logs.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { LibraryModule } from './library/library.module';
import { SimCardModule } from './sim-card/sim-card.module';
import { DeviceModule } from './device/device.module';
import { DriverModule } from './driver/driver.module';
import { RouteModule } from './route/route.module';
import { PointModule } from './point/point.module';
import { OverspeedModule } from './overspeed/overspeed.module';
import { TripModule } from './trip/trip.module';
import { UserManualsModule } from './user-manuals/user-manuals.module';
import { UserManualStepsModule } from './user-manual-steps/user-manual-steps.module';
import { FeaturesModule } from './features/features.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ScheduleTripModule } from './schedule-trip/schedule-trip.module';
import { VehicleSeatModule } from './vehicle-seat/vehicle-seat.module';
import { ScheduleTripSeatModule } from './schedule-trip-seat/schedule-trip-seat.module';
import { ScheduleTripPointModule } from './schedule-trip-point/schedule-trip-point.module';
import { PriceModule } from './price/price.module';
import { VoucherModule } from './voucher/voucher.module';
import { CustomerBankModule } from './customer-bank/customer-bank.module';
import { CustomerModule } from './customer/customer.module';
import { CustomerPassengerModule } from './customer-passenger/customer-passenger.module';
import { OrderModule } from './order/order.module';
import { InvoiceModule } from './invoice/invoice.module';
import { OrderItemModule } from './order-item/order-item.module';
import { ArticlesModule } from './articles/articles.module';
import { FaqContentsModule } from './faq-content/faq-content.module';
import { FaqsModule } from './faqs/faqs.module';
import { TestimonyModule } from './testimony/testimony.module';
import { AboutsModule } from './abouts/abouts.module';
import { BannerModule } from './banner/banner.module';
import { SliderModule } from './slider/slider.module';
import { CareerContentModule } from './career-content/career-content.module';
import { CareerJobModule } from './career-job/career-job.module';
import { CareerApplyJobModule } from './career-apply-job/career-apply-job.module';
import { ContactContentModule } from './contact-content/contact-content.module';
import { ContactMessageModule } from './contact-message/contact-message.module';
import { LanguageModule } from './language/language.module';
import { SubscriptionOrderModule } from './subscription-order/subscription-order.module';
import { TranslationModule } from './translation/translation.module';
import { PolicyModule } from './policy/policy.module';
import { OverspeedLimitModule } from './overspeed-limit/overspeed-limit.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { ApiModule } from './api/api.module';
import { GoogleModule } from './google/google.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    RoleModule,
    UserModule,
    MailModule,
    EmailModule,
    PermissionModule,
    UserDeviceModule,
    OneSignalAppModule,
    NotificationsModule,
    DeviceLogsModule,
    VehicleModule,
    LibraryModule,
    SimCardModule,
    DeviceModule,
    DriverModule,
    RouteModule,
    PointModule,
    OverspeedModule,
    TripModule,
    UserManualsModule,
    UserManualStepsModule,
    FeaturesModule,
    ScheduleModule,
    ScheduleTripModule,
    VehicleSeatModule,
    ScheduleTripSeatModule,
    ScheduleTripPointModule,
    PriceModule,
    VoucherModule,
    CustomerBankModule,
    CustomerModule,
    CustomerPassengerModule,
    OrderModule,
    InvoiceModule,
    OrderItemModule,
    ArticlesModule,
    FaqContentsModule,
    FaqsModule,
    TestimonyModule,
    AboutsModule,
    BannerModule,
    SliderModule,
    CareerContentModule,
    CareerJobModule,
    CareerApplyJobModule,
    ContactContentModule,
    ContactMessageModule,
    LanguageModule,
    SubscriptionOrderModule,
    TranslationModule,
    PolicyModule,
    OverspeedLimitModule,
    GeolocationModule,
    ApiModule,
    GoogleModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
