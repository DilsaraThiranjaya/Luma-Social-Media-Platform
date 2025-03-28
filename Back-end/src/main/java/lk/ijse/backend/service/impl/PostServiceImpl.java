package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.PostMediaDTO;
import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.PostMedia;
import lk.ijse.backend.entity.WorkExperience;
import lk.ijse.backend.repository.PostMediaRepository;
import lk.ijse.backend.repository.PostRepository;
import lk.ijse.backend.service.PostService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final ModelMapper modelMapper;

    @Transactional
    @Override
    public int createPost(PostDTO postDTO) {
        List<PostMediaDTO> media = postDTO.getMedia();
        postDTO.setMedia(null);

        Post savedPost = postRepository.save(modelMapper.map(postDTO, Post.class));

        if (savedPost != null) {
            List<PostMedia> newMedia = media.stream()
                    .map(dto -> convertToMedia(dto, savedPost))
                    .collect(Collectors.toList());
            postMediaRepository.saveAll(newMedia);
            return VarList.OK;
        }
        return VarList.Conflict;
    }

    private PostMedia convertToMedia(PostMediaDTO dto, Post savedPost) {
        PostMedia media = modelMapper.map(dto, PostMedia.class);
        media.setPost(savedPost);
        return media;
    }
}
