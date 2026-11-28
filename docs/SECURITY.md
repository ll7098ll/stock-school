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

### Firestore 보안 규칙 ([`firestore.rules`](../firestore.rules)) 및 인덱스 예외 ([`firestore.indexes.json`](../firestore.indexes.json))

실제 배포 시 프로젝트 루트의 `firestore.rules` 및 `firestore.indexes.json`을 Firebase Console 또는 `firebase deploy --only firestore`로 함께 배포해야 합니다.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.keys().hasOnly([
          'schemaVersion', 'displayName', 'currentLevel', 'gameStates', 'updatedAt'
        ])
        && request.resource.data.currentLevel in ['elementary', 'middle', 'high']
        && request.resource.data.schemaVersion is int
        && request.resource.data.gameStates is map
        && request.resource.data.gameStates.size() > 0
        && request.resource.data.gameStates.keys().hasOnly(['elementary', 'middle', 'high'])
        && (request.resource.data.displayName == null ||
            (request.resource.data.displayName is string && request.resource.data.displayName.size() <= 80))
        && request.resource.data.updatedAt is string;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

이 규칙이 보장하는 것:
- ✅ 인증된 사용자만 자신의 문서 읽기·쓰기·삭제 가능
- ✅ 허용된 스키마 필드 외 임의 필드 주입 및 빈 `gameStates` 덮어쓰기 차단
- ✅ 개인정보 보호법 제21조·제36조 준수: 회원 탈퇴 시 본인 문서 즉시 삭제 허용
- ❌ 타 사용자 데이터 및 미지정 컬렉션 접근 전면 차단

### 학생 개인정보 보호 및 인증 보안

- **게스트 모드(기본 권장)**: 개인정보를 서버로 전송하지 않고 브라우저(`localStorage`)에만 저장하여 만 14세 미만 학생도 안전하게 이용 가능
- **Google 클라우드 로그인(선택)**: 진입 전 연령 확인(만 14세 이상 또는 법정대리인/학교 가정통신문 동의) 및 약관·개인정보처리방침·국외이전(Google LLC, 미국) 동의 절차 적용
- **데이터 파기**: 앱 내 `설정 → 데이터 삭제 / 회원 탈퇴`에서 Firestore 문서 및 Firebase Auth 계정을 즉시 영구 삭제 가능
- **권장 운영 설정**: Google Cloud Console에서 Firebase API Key의 **HTTP Referrer(배포 도메인) 제한** 및 **Firestore 리전 서울(`asia-northeast3`)** 사용 권장

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
