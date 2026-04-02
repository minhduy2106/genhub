import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('shifts')
export class ShiftsController {
  constructor(private service: ShiftsService) {}

  @Post('open')
  open(@CurrentUser() user: JwtPayload, @Body('openingCash') openingCash: number) {
    return this.service.open(user.storeId, user.sub, openingCash ?? 0);
  }

  @Patch(':id/close')
  close(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { closingCash: number; notes?: string },
  ) {
    return this.service.close(id, user.storeId, user.sub, body.closingCash, body.notes);
  }

  @Get('current')
  current(@CurrentUser() user: JwtPayload) {
    return this.service.current(user.storeId, user.sub);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.storeId);
  }
}
