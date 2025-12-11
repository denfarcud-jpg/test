import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PostingService } from './posting.service';
import { CreatePostingDto } from './dto/create-posting.dto';
import { UpdatePostingDto } from './dto/update-posting.dto';
import { GetPostingsFilterDto } from './dto/get-postings-filter.dto';

@Controller('posting')
export class PostingController {
  constructor(private readonly postingService: PostingService) {}

  @Post()
  create(@Body() createDto: CreatePostingDto) {
    return this.postingService.create(createDto);
  }

  @Get()
  findAll(@Query() filters: GetPostingsFilterDto) {
    return this.postingService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePostingDto) {
    return this.postingService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postingService.remove(+id);
  }
}