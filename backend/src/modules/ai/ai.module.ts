import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { AIContextBuilderService } from './ai-context-builder.service';
import { AIController } from './ai.controller';
import { AIOrchestratorService } from './ai-orchestrator.service';
import { AI_PROVIDER } from './ai.types';
import { AISafetyService } from './ai-safety.service';
import { OpenAIProvider } from './providers/openai.provider';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [AIController],
  providers: [
    AIContextBuilderService,
    AISafetyService,
    OpenAIProvider,
    { provide: AI_PROVIDER, useExisting: OpenAIProvider },
    AIOrchestratorService,
  ],
  exports: [AIOrchestratorService],
})
export class AIModule {}
