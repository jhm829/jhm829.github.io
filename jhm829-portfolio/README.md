# JHM829 개발 포트폴리오 (GitHub Pages)

웹사이트 주소(설정 완료 후): **https://jhm829.github.io**

이 폴더에는 공개 포트폴리오(`index.html`)와 소유자용 프로젝트 관리 페이지(`admin.html`)가 들어 있습니다.
외부 빌드 도구 없이 GitHub Pages에서 사용할 수 있습니다.

## 1. 포트폴리오 처음 배포하기

1. https://github.com/new 에서 새 저장소를 만듭니다.
2. Repository name을 **jhm829.github.io**로 정확하게 지정하고 **Public**으로 설정합니다.
3. 이 ZIP을 압축 해제한 다음 내부 파일과 폴더를 모두 저장소의 최상위에 업로드합니다. ZIP 파일 자체를 업로드하면 안 됩니다.
   - GitHub 저장소 화면의 **Add file → Upload files**를 사용해 업로드할 수 있습니다.
   - `index.html`, `admin.html`, `app.js`, `admin.js`, `style.css`, `favicon.svg`, `.nojekyll`, `data/projects.json`이 있어야 합니다.
   - 웹 업로드 과정에서 숨김 파일 `.nojekyll`이 누락된다면 직접 만드세요. 이 프로젝트의 동작에 필수는 아니지만 Jekyll 간섭 방지용입니다.
4. 저장소 **Settings → Pages → Build and deployment**에서 Source를 **Deploy from a branch**, Branch를 **main**, Folder를 **/(root)**로 선택하여 Save 합니다.
5. 배포 후 **https://jhm829.github.io** 에 접속하세요. 반영되기까지 몇 분이 걸릴 수 있습니다.

> 공개 웹사이트에 파일을 올릴 때는 개인정보/비밀번호/접근 토큰/과제 비공개 자료를 포함하지 마세요.

## 2. 프로젝트를 웹 화면에서 등록하기

1. **https://jhm829.github.io/admin.html** 에 접속합니다.
2. GitHub에서 [Fine-grained personal access token 발급](https://github.com/settings/personal-access-tokens/new):
   - Resource owner: `jhm829`
   - Repository access: **Only select repositories**에서 `jhm829.github.io`만 선택
   - Repository permissions: **Contents → Read and write**
   - 만료 기간은 가능한 짧게 지정. 생성된 토큰은 비밀번호처럼 관리합니다.
3. `admin.html`에 토큰을 붙여넣고 **저장소 연결**을 누릅니다.
4. 프로젝트 제목, 한 줄 소개, 자세한 설명, GitHub 주소, 기술 스택 등을 입력합니다.
5. 필요한 경우 PDF/PPTX/이미지/코드 파일을 선택해 첨부합니다. 파일당 5MB 제한이 있습니다.
6. **GitHub에 저장하기**를 누릅니다. 첨부 파일과 `data/projects.json`이 GitHub 저장소에 커밋됩니다.
7. 포트폴리오 페이지를 새로고침하면 등록한 프로젝트 카드를 볼 수 있습니다.

**중요:** `admin.html`은 공개 파일이므로 누구나 열어 볼 수 있으나 올바른 쓰기 권한의 토큰이 있어야 편집할 수 있습니다. 토큰은 브라우저 탭의 메모리에만 보관하며 탭을 닫으면 사라집니다. 신뢰할 수 있는 본인 기기에서만 사용하고 토큰을 웹 코드, GitHub 저장소, 채팅, 스크린샷에 남기지 마세요. 토큰 사용에 익숙하지 않다면 아래의 수동 편집 방법을 쓰는 편이 안전합니다.

## 3. 관리 페이지 없이 수동으로 추가하는 방법

`data/projects.json`을 GitHub 웹 편집기로 열어서 다음 형태의 프로젝트 객체를 `projects` 배열에 추가합니다.

```json
{
  "projects": [
    {
      "id": "my-first-project",
      "title": "내 프로젝트 이름",
      "category": "Python",
      "summary": "프로젝트를 한 줄로 소개합니다.",
      "description": "제작 목적, 주요 기능, 내가 맡은 역할, 배운 점을 적습니다.",
      "repoUrl": "https://github.com/jhm829",
      "demoUrl": "",
      "tech": ["Python", "Git"],
      "image": "",
      "attachments": [
        {"name":"프로젝트 발표 자료.pdf","url":"uploads/example/presentation.pdf"}
      ],
      "updatedAt": "2026-11-18T00:00:00.000Z"
    }
  ]
}
```

첨부파일은 `uploads/` 폴더에 직접 올리고 해당 경로를 `attachments`에 적으면 됩니다.

## 4. 구성 파일

- `index.html` : 방문자가 보는 웹사이트
- `style.css` : 반응형 디자인
- `app.js` : 프로젝트 목록 로딩, 필터링, 상세 보기
- `data/projects.json` : 등록 프로젝트 정보
- `admin.html` + `admin.js` : 관리자 등록/수정/삭제 및 파일 업로드
- `uploads/` : 등록된 첨부파일과 이미지
- `.nojekyll` : GitHub Pages가 Jekyll 파일 처리에 관여하지 않도록 함

## 5. 제약과 참고사항

- 이 사이트는 **정적 웹사이트**입니다. 방문자에게 파일 업로드 권한은 제공하지 않습니다.
- 관리 페이지는 GitHub REST API를 통해 GitHub 저장소에 직접 커밋합니다. GitHub 계정에 승인된 권한이 필요합니다.
- 관리 페이지에서 삭제한 프로젝트의 기존 첨부파일은 자동 삭제하지 않습니다. 필요할 경우 GitHub에서 직접 삭제하세요.
- 업로드한 파일은 공개 자료입니다. 모든 파일이 배포되는 것은 GitHub Pages의 빌드, MIME, 파일 형식 제한에 따라 달라질 수 있습니다.
- 웹 브라우저의 GitHub 저장소 업로드는 일반적으로 파일당 25MiB 제한이 있으며, 이 관리 도구는 편의와 안정성을 위해 5MiB로 제한합니다.
- `index.html`을 파일 탐색기에서 직접 더블클릭하면 브라우저 보안 정책으로 JSON을 불러오지 못할 수 있습니다. GitHub Pages에 배포하거나 로컬 개발 서버(`python -m http.server 8000`)를 사용하세요.

공식 문서: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
