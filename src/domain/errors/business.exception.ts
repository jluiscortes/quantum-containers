export class BusinessException extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}
