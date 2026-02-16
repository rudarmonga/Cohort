export class AppError extends Error {
  status: number;
  type: string;

  constructor(message: string, status = 500, type = "SERVER_ERROR") {
    super(message);
    this.status = status;
    this.type = type;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
