# 🔒 보안 정책 (Security Policy)

## 📋 지원 버전

| 버전 | 지원 상태 |
|:---:|:---:|
| 1.0.x | ✅ 보안 업데이트 지원 |

## 🐛 취약점 보고 방법

보안 취약점을 발견하셨다면, **공개 이슈로 보고하지 마시고** 다음 방법을 사용해 주세요:

1. **GitHub Security Advisories**: 저장소의 Security 탭에서 "Report a vulnerability"를 이용
2. **비공개 이메일**: 프로젝트 관리자에게 직접 연락

### 보고 시 포함할 내용

- 취약점 유형 및 영향 범위
- 재현 단계
- 영향받는 파일/코드 위치
- 가능한 해결 방안 (선택)

## 🔐 보안 모범 사례

### Firebase API Key에 대하여

> [!IMPORTANT]
> Firebase API Key는 **클라이언트 측 키**로, 소스 코드에 노출되는 것이 정상입니다. 이는 비밀 키(Secret Key)가 아닙니다.

Firebase API Key의 역할:
- Firebase 프로젝트를 **식별**하는 용도
- 데이터 **접근 권한을 부여하지 않음**
- 실제 보안은 **Firestore Security Rules**로 관리

### Firestore 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // 인증된 사용자만 자신의 문서에 접근 가능
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}
```

이 규칙이 보장하는 것:
- ✅ 인증된 사용자만 데이터 접근
- ✅ 자신의 문서만 읽기/쓰기 가능
- ❌ 다른 사용자의 데이터 접근 불가
- ❌ 미인증 사용자의 모든 접근 차단

### 인증 플로우 보안

- Firebase Authentication의 Google OAuth 2.0 사용
- 토큰 관리를 Firebase SDK가 자동 처리
- 클라이언트에서 비밀번호를 직접 처리하지 않음

## 📜 책임 공개 정책

보안 취약점을 보고해 주시면:
1. **48시간 이내** 보고 확인 회신
2. **7일 이내** 초기 평가 결과 공유
3. **30일 이내** 수정 패치 릴리즈 목표
4. 수정 완료 후 보고자 크레딧 공개 (동의 시)

---

<div align="center">

**🔒 보안 취약점 발견 시 책임감 있는 공개를 부탁드립니다.**

</div>
