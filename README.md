## 🤖 고객이 원하는 최적의 추천 값을 제안하는 자동화된 Prescriptive AI



## ✅ Hackathon Overview

<p align="center"><img src="https://github.com/user-attachments/assets/6babcaa4-fbc4-43fb-ba80-9492418b59d3" style="max-width: 100%; height: auto;"></p>


✔️ **프로젝트 주제**

다양한 데이터를 분석하고 고객이 원하는 최적의 추천 값을 제안하는 자동화된 Prescriptive AI 구현



✔️ **문제정의**

- 유저가 원하는 Output값 Y에 대해 최적의 InputX를 추천하는 문제 
  - 다만 X값이 주어졌을 때,하나의 Y값이 나올 수 있지만, Y값이 주어졌을 때는,여러 X값이 나옴 
  - 여러 데이터셋에 대해 자동화된 과정 + ResponseTime 제약



✔️ **기대효과**

- 고객 맞춤형 최적 솔루션 제공, 자동화된 데이터 분석 및 의사 결정 지원



## ✅ 팀원 소개

**Todo:** **우리 팀 소개글 간단히 적기**

### 👪 팀원

<table>
  <tr>
    <td align="center"><a href="https://github.com/kkyungyoon"><img src="https://github.com/kkyungyoon.png" width="100px;" alt=""/><br /><sub><b>김경윤</b></sub></a><br /><a href="https://github.com/kkyungyoon" title="Code"></td>
    <td align="center"><a href="https://github.com/kimyoungseok3232"><img src="https://github.com/kimyoungseok3232.png" width="100px;" alt=""/><br /><sub><b>김영석</b></sub></a><br /><a href="https://github.com/kimyoungseok3232" title="Code"></td>
    <td align="center"><a href="https://github.com/Dangtae"><img src="https://github.com/Dangtae.png" width="100px;" alt=""/><br /><sub><b>신영태</b></sub></a><br /><a href="https://github.com/Dangtae" title="Code"></td>
    <td align="center"><a href="https://github.com/andantecode"><img src="https://github.com/andantecode.png" width="100px;" alt=""/><br /><sub><b>함로운</b></sub></a><br /><a href="https://github.com/andantecode" title="Code"></td>
     <td align="center"><a href="https://github.com/randfo42"><img src="https://github.com/randfo42.png" width="100px;" alt=""/><br /><sub><b>김태성</b></sub></a><br /><a href="https://github.com/randfo42" title="Code"></td>
	  <td align="center"><a href="https://github.com/taeyoung1005"><img src="https://github.com/taeyoung1005.png" width="100px;" alt=""/><br /><sub><b>박태영</b></sub></a><br /><a href="https://github.com/taeyoung1005" title="Code"></td>
  </tr>
</table>

### 👪 역할

| 이름 | 구성 및 역할                                                 |
| :--- | ------------------------------------------------------------ |
| 영석 | RL을 응용한 search 모델 작성, 테스트 코드 정리, 데이터셋 별 테스트 후 오류 발견 및 공유 또는 수정 |
| 태성 | 문제 정의 및 평가 지표 정의, 모델링 코드 작성 및 실험. UI 요구 사항 반영. |
| 태영 | 요구사항 분석, 기능 및 DB 설계, BackEnd Server 구현, 모델 서빙 구현 |
| 경윤 | GA 구현 및 실험, Surrogate - Search 연결, Evaluation Metric 구현, TabPFN, CatBoost 구현, Surrogate Model 고도화 |
| 로운 | React & Chakra UI를 활용한 웹 기반 User-interface 개발       |
| 영태 | 데이터 전처리 자동화 구현 및 최적화, 타 팀 데이터셋에 대한 EDA 및 feature engineering, Surrogate(LightGBM) 구현 |



## ✅ 타임라인

팀원별 역할을 분담하여 각 파트별로 주어진 `Task`를 수행하였으며, 한 달 동안 `데이터 전처리`부터 `Prescriptive AI 개발`, 그리고 `서비스 배포`까지 전 과정을 완료하기 위해 효율적인 타임라인을 구성하여 진행하였습니다.

✔️ **각 파트 별 타임라인 표**

![image-20250210233911859](https://github.com/user-attachments/assets/10166b51-28dd-485b-83be-a59ef632c0e3)
![image-20250210234000265](https://github.com/user-attachments/assets/ec5ffaa0-2a0b-48bf-bdd6-f7ec05e54b1e)
![image-20250210234030050](https://github.com/user-attachments/assets/b6336412-11f9-46b1-abdc-41765cc3df7b)
![image-20250210234101369](https://github.com/user-attachments/assets/4905c9af-c6f5-4c1c-a02c-e0d1385ce8c2)





## ✅ 시스템 구성도 및 플로우 차트


![image-20250210234205329](https://github.com/user-attachments/assets/b6c54b76-91dd-4efd-a036-e72d92a08d25)






## ✅ Getting Started

| 아래 Readme를 통해 직접 프로젝트에 구현된 코드를 살펴볼 수 있습니다.

### 💫 Model

- 

### 📊 Data

- [Data Preprocess](https://github.com/boostcampaitech7/level4-cv-finalproject-hackathon-cv-06-lv3/tree/main/argmax_mini/hackathon/src/preprocess) / [README.md]()
  - Merge & Feature Engineering
    - [DVM](https://github.com/boostcampaitech7/level4-cv-finalproject-hackathon-cv-06-lv3/tree/main/argmax_mini/hackathon/src/preprocess/dvm) / [README.md](https://github.com/boostcampaitech7/level4-cv-finalproject-hackathon-cv-06-lv3/blob/main/argmax_mini/hackathon/src/preprocess/dvm/README.md)
    - [Ecommerce](https://github.com/boostcampaitech7/level4-cv-finalproject-hackathon-cv-06-lv3/tree/main/argmax_mini/hackathon/src/preprocess/ecommerce) / [README.md](https://github.com/boostcampaitech7/level4-cv-finalproject-hackathon-cv-06-lv3/blob/main/argmax_mini/hackathon/src/preprocess/ecommerce/README.md)

### 🖼️ Frontend

- 

### 💻 Backend

- 

## Links
