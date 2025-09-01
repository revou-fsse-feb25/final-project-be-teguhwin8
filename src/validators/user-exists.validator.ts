/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
@ValidatorConstraint({ name: 'userExists', async: true })
export class UserExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly userService: UserService) {}

  async validate(user_id: string, args: ValidationArguments) {
    if (!this.userService) {
      throw new Error('UserService not set in UserExistsConstraint');
    }

    const user = await this.userService.findOne(user_id);
    return !!user;
  }

  defaultMessage(args: ValidationArguments) {
    return `User with ID ${args.value} does not exist.`;
  }
}

export function UserExists(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'userExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: UserExistsConstraint,
    });
  };
}
