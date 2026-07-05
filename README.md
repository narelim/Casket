# Casket — 자캐 아카이브

클린/미니멀 다크 테마의 자작 캐릭터(자캐) 아카이브 앱입니다. React + Vite + CSS Modules.

## 기능

- 캐릭터 추가 / 편집 / 삭제
- 입력 즉시 **로컬스토리지 자동 저장**
- **JSON 내보내기 / 불러오기** (불러올 때 추가 또는 대체 선택)
- 실시간 **캐릭터 카드 미리보기**
- 이름 · 별칭 · 태그 검색

## 캐릭터 필드

이름, 별칭, 나이, 성별, 생일, 한줄소개, 외관설명, 성격, 설정/배경, 태그(쉼표 구분)

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 구조

```
src/
├─ App.jsx                  상태 관리 · 로컬스토리지 · JSON 입출력
├─ lib/character.js         필드 정의 · 캐릭터 생성/정규화 헬퍼
└─ components/
   ├─ Sidebar.jsx           캐릭터 목록 · 검색 · 툴바
   ├─ CharacterForm.jsx     편집 폼
   └─ CharacterCard.jsx     미리보기 카드
```

데이터는 브라우저 로컬스토리지(`casket.characters.v1`)에만 저장됩니다. 백업하려면 **내보내기**로 JSON을 받아 두세요.
