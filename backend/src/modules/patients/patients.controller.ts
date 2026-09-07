import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PatientsService } from './patients.service';
import { AssociateChamberDto } from './dto/associate-chamber.dto';
import { CreatePatientAllergyDto } from './dto/create-patient-allergy.dto';
import { CreatePatientConditionDto } from './dto/create-patient-condition.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'patients', version: '1' })
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a patient in a chamber' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePatientDto) {
    return this.patients.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List patients for a chamber' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: PatientQueryDto) {
    return this.patients.list(user, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search patients by name, phone, or patient code' })
  search(@CurrentUser() user: AuthenticatedUser, @Query() query: SearchPatientDto) {
    return this.patients.search(user, query);
  }

  @Get(':patientId')
  @ApiOperation({ summary: 'Get a patient profile' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patients.getById(user, patientId);
  }

  @Patch(':patientId')
  @ApiOperation({ summary: 'Update patient demographic information' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patients.update(user, patientId, dto);
  }

  @Post(':patientId/chambers')
  @ApiOperation({ summary: 'Associate a patient with a chamber' })
  associate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Body() dto: AssociateChamberDto,
  ) {
    return this.patients.associateChamber(user, patientId, dto);
  }

  @Get(':patientId/allergies')
  @ApiOperation({ summary: 'List patient allergies' })
  listAllergies(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patients.listAllergies(user, patientId);
  }

  @Post(':patientId/allergies')
  @ApiOperation({ summary: 'Add a patient allergy' })
  addAllergy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientAllergyDto,
  ) {
    return this.patients.addAllergy(user, patientId, dto);
  }

  @Delete(':patientId/allergies/:allergyId')
  @ApiOperation({ summary: 'Remove a patient allergy' })
  removeAllergy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Param('allergyId') allergyId: string,
  ) {
    return this.patients.removeAllergy(user, patientId, allergyId);
  }

  @Get(':patientId/conditions')
  @ApiOperation({ summary: 'List patient conditions' })
  listConditions(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patients.listConditions(user, patientId);
  }

  @Post(':patientId/conditions')
  @ApiOperation({ summary: 'Add a patient condition' })
  addCondition(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientConditionDto,
  ) {
    return this.patients.addCondition(user, patientId, dto);
  }
}
