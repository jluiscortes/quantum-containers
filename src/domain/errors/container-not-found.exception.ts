import { BusinessException } from './business.exception';

export class ContainerNotFoundException extends BusinessException {
  constructor(containerId: string) {
    super(
      'CONTAINER_NOT_FOUND',
      `No se encontraron eventos para el contenedor ${containerId}`,
      404
    );
  }
}
