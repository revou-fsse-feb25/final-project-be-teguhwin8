export class Testimony {
  id: string;
  customerId: string;
  rating?: number;
  message?: string;

  constructor(data: Partial<Testimony>) {
    this.id = data.id;
    this.customerId = data.customerId;
    this.rating = data.rating;
    this.message = data.message;
  }
}
