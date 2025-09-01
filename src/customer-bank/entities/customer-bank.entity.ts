export class CustomerBankEntity {
  id: string;
  customerId: string;
  nameAccount?: string;
  codeAccount: string;
  nameBank: string;
  codeBank: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
