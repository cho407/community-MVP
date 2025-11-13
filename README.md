# Community MVP

간단한 커뮤니티 앱 MVP. Expo + Firebase 기반으로 회원 인증, 게시글 CRUD, 댓글 기능을 제공합니다.

## 주요 기능
- 이메일/비밀번호 회원가입·로그인
- 하단 탭 (`게시판` / `내 정보`) 네비게이션
- 게시글 목록 · 상세 · 작성 · 수정 · 이미지 첨부
- 게시글 댓글 작성 및 삭제
- 내 정보 탭에서 프로필, 로그아웃, 탈퇴, 내 게시글 조회

## 사용 기술 스택
- **App**: Expo 54, React Native 0.81, TypeScript
- **Navigation**: Expo Router 6 (Tabs + Stack)
- **Data / State**: Firebase Auth · Firestore · Storage, @tanstack/react-query
- **Form Validation**: zod
- **환경 도구**: ESLint (expo config)

## 폴더 구조
```
community-mvp/
├── app/
│   ├── _layout.tsx            # 전역 Provider, Auth Gate
│   ├── (tabs)/
│   │   ├── _layout.tsx        # 탭 설정
│   │   ├── index.tsx          # 게시판 탭
│   │   └── profile.tsx        # 내 정보 탭
│   ├── post/
│   │   ├── _layout.tsx        # 게시글 Stack 헤더
│   │   ├── new.tsx            # 게시글 작성
│   │   ├── [id].tsx           # 게시글 상세 + 댓글
│   │   └── edit.tsx           # 게시글 수정
│   ├── login.tsx              # 로그인
│   └── register.tsx           # 회원가입
├── components/                # Loading, PostItem
├── hooks/                     # useAuth (Firebase Auth context)
├── services/                  # firebase.ts, posts.ts, comments.ts
├── types/                     # post.ts 타입 정의
├── App.tsx                    # Expo Router 엔트리
├── package.json
├── tsconfig.json
└── app.json
```

## 환경 변수 명세 (.env)
| 변수 | 설명 |
| ---- | ---- |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

## 실행 방법
```bash
npm install
npm run start          # Expo 개발 서버 실행
# 필요 시 캐시 초기화
npx expo start --clear
```

## 주요 변수/상수
| 위치 | 식별자 | 설명 |
| ---- | ------ | ---- |
| `hooks/useAuth.tsx` | `AuthContext` / `AuthProvider` | Firebase Auth 상태 전역 관리 컨텍스트 |
| `hooks/useAuth.tsx` | `profile` | Firestore 사용자 프로필 정보 객체 |
| `services/posts.ts` | `postsCollection` | Firestore `posts` 컬렉션 레퍼런스 |
| `services/posts.ts` | `createPost`, `updatePost`, `deletePost` | 게시글 CRUD 서비스 함수 |
| `services/comments.ts` | `commentsCollection` | Firestore `comments` 컬렉션 레퍼런스 |
| `services/comments.ts` | `subscribeToComments` | 게시글 댓글 실시간 구독 함수 |
| `app/(tabs)/index.tsx` | `posts` | 게시글 목록 쿼리 결과 (React Query) |
| `app/(tabs)/profile.tsx` | `myPosts` | 현재 사용자 게시글 목록 (React Query) |
| `app/post/[id].tsx` | `comment`, `comments`, `sending` | 댓글 입력값, 댓글 리스트, 전송 상태 |
| `app/post/[id].tsx` | `inputHeight` | 댓글 입력창 동적 높이 상태 |
| `app/post/_layout.tsx` | `Stack` 옵션 | 게시글 관련 화면(Stack) 헤더 옵션 설정 |
| `services/firebase.ts` | `firebaseConfig` | Firebase 초기화 환경 변수 매핑 |