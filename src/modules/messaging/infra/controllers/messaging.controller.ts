import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiParam } from "@nestjs/swagger";
import { MessagingService } from "@messaging/application/services/messaging.service";
import { PublishMessageDto } from "@messaging/application/dto/publish-message.dto";
import { ConsumedMessageDto } from "@messaging/application/dto/consumed-message.dto";
import { Public } from "@shared/infra/decorators/public.decorator";

const EXCHANGES: Record<string, { exchange: string; routingKey: string }> = {
  "student.created": { exchange: "academic.students.created.exchange", routingKey: "student.created" },
  "student.updated": { exchange: "academic.students.updated.exchange", routingKey: "student.updated" },
  "student.deleted": { exchange: "academic.students.deleted.exchange", routingKey: "student.deleted" },
  "subject.created": { exchange: "academic.subjects.created.exchange", routingKey: "subject.created" },
  "subject.updated": { exchange: "academic.subjects.updated.exchange", routingKey: "subject.updated" },
  "subject.deleted": { exchange: "academic.subjects.deleted.exchange", routingKey: "subject.deleted" },
  "teacher.created": { exchange: "academic.teachers.created.exchange", routingKey: "teacher.created" },
  "teacher.updated": { exchange: "academic.teachers.updated.exchange", routingKey: "teacher.updated" },
  "teacher.deleted": { exchange: "academic.teachers.deleted.exchange", routingKey: "teacher.deleted" },
};

const QUEUES: Record<string, { queue: string; exchange: string; routingKey: string }> = {
  "auth.created": { queue: "academic-teachers.auth.created.queue", exchange: "auth.created.exchange", routingKey: "user.created" },
  "auth.updated": { queue: "academic-teachers.auth.updated.queue", exchange: "auth.updated.exchange", routingKey: "user.updated" },
  "auth.deleted": { queue: "academic-teachers.auth.deleted.queue", exchange: "auth.deleted.exchange", routingKey: "user.deleted" },
};

@ApiTags("messaging")
@Controller("messaging")
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post("exchanges")
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Criar/assegurar todas as exchanges do grupo Acadêmico" })
  async createExchanges(): Promise<void> {
    for (const config of Object.values(EXCHANGES)) {
      await this.messagingService.createExchange(config.exchange, "direct");
    }
    // Assegura as exchanges que consumimos para evitar erros de binding
    for (const config of Object.values(QUEUES)) {
      await this.messagingService.createExchange(config.exchange, "direct");
    }
  }

  @Post("queues")
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Criar/assegurar as filas e vinculá-las às exchanges" })
  async createQueues(): Promise<void> {
    for (const config of Object.values(QUEUES)) {
      await this.messagingService.createQueue(config.queue, config.exchange, config.routingKey);
    }
  }

  @Post("publish/:event")
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Publicar mensagem na exchange relacionada ao evento" })
  @ApiParam({ name: "event", description: "O evento da exchange. Ex: student.created", example: "student.created" })
  async publish(
    @Param("event") event: string,
    @Body() body: PublishMessageDto
  ): Promise<void> {
    const config = EXCHANGES[event];
    if (!config) {
      throw new NotFoundException(`Configuração de exchange não encontrada para o evento: ${event}`);
    }
    return this.messagingService.publish(body, config.exchange, config.routingKey);
  }

  @Get("consume/:event")
  @Public()
  @ApiOperation({ summary: "Ler próxima mensagem da fila relacionada ao evento" })
  @ApiParam({ name: "event", description: "O evento da fila. Ex: auth.created", example: "auth.created" })
  async consume(@Param("event") event: string): Promise<ConsumedMessageDto> {
    const config = QUEUES[event];
    if (!config) {
      throw new NotFoundException(`Configuração de fila não encontrada para o evento: ${event}`);
    }
    return this.messagingService.consume(config.queue);
  }
}
