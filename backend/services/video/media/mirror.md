# Mirrored local video (frontend)

Local preview should use CSS `transform: scaleX(-1)` on the self-view `<video>` element so patients see a natural mirror. Remote doctor video is **not** mirrored.

Implement in: `frontend/src/features/video/components/LocalVideo.tsx`
