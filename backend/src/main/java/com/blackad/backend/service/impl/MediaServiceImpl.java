package com.blackad.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.blackad.backend.entity.Media;
import com.blackad.backend.mapper.MediaMapper;
import com.blackad.backend.service.MediaService;
import org.springframework.stereotype.Service;

@Service
public class MediaServiceImpl extends ServiceImpl<MediaMapper, Media> implements MediaService {
}
