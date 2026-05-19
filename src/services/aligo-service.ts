import config from '../config';

// aligoapi 라이브러리 로드
const aligoapi = require('aligoapi');

// 알리고 API 응답 타입 정의
export interface AligoResponse {
    code: number;
    message: string;
    info?: any;
}

// 알림톡 요청 데이터 타입 인터페이스
// userid와 sender는 config 파일에서 가져오므로 여기서는 제외함
export interface AlimTalkRequestData {
    receiver: string;  // 수신자 휴대폰 번호
    tpl_code: string;  // 알리고에 등록된 템플릿 코드
    subject: string;   // 알림톡 제목 (강조 표기형 등에서 사용)
    message: string;   // 알림톡 내용 (템플릿 내용과 띄어쓰기까지 일치해야 함)
    failover?: 'Y' | 'N'; // 카카오톡 전송 실패 시 문자(LMS/SMS)로 대체 발송 여부
    fsubject?: string; // 대체 문자 발송 시 제목
    fmessage?: string; // 대체 문자 발송 시 내용
    testMode?: 'Y' | 'N'; // 테스트 모드 여부 (Y일 경우 실제 발송되지 않음)
}

// 템플릿 코드 상수 정의
const TPL_CODES = {
    OFFLINE: 'UE_0257', // 오프라인 알림 템플릿
    BATTERY: 'UE_0258', // 배터리 부족 알림 템플릿
    COLLECTION: 'UE_0259' // 채집 상태 알림 템플릿
};

export class AligoService {
    
    /**
     * 알림톡 전송 공통 메서드
     * aligoapi 라이브러리를 사용하여 실제 전송 요청을 수행합니다.
     */
    public async sendAlimTalk(data: AlimTalkRequestData): Promise<AligoResponse> {
        // apikey: 알리고 API Key, userid: 알리고 아이디
        const authData = {
            apikey: config.aligoApiKey,
            userid: config.aligoUserId
        };

        const req = {
            body: {
                senderkey: config.aligoSenderKey, // 카카오톡 채널 발신 프로필 키
                sender: config.aligoSenderPhone,  // 발신자 전화번호 (알리고에 등록된 번호)
                tpl_code: data.tpl_code,          // 템플릿 코드
                receiver_1: data.receiver,        // 수신자 번호 (첫 번째 수신자)
                recvname_1: data.receiver,        // 수신자 이름 (편의상 번호로 대체)
                subject_1: data.subject,          // 알림톡 제목
                message_1: data.message,          // 알림톡 내용
                failover: data.failover === 'Y' ? 'Y' : 'N', // 실패 시 문자 대체 발송 설정
                fsubject_1: data.fsubject || data.subject,   // 대체 문자 제목
                fmessage_1: data.fmessage || data.message,   // 대체 문자 내용
                testMode: data.testMode === 'Y' ? 'Y' : undefined // 테스트 모드 설정
            },
            headers: {}, // 라이브러리 내부 참조용 빈 객체
            query: {}    // 라이브러리 내부 참조용 빈 객체
        };

        // 디버깅용 로그: 전송하려는 데이터 확인
        // console.log('---------------------------------------------------');
        // console.log('[Aligo] 알림톡 전송 시도');
        // console.log(`수신자: ${data.receiver}`);
        // console.log(`템플릿: ${data.tpl_code}`);
        // console.log(`내용: ${data.message}`);
        // console.log('---------------------------------------------------');

        // 3. 라이브러리 호출 및 결과 반환
        try {
            const result = await aligoapi.alimtalkSend(req, authData);
            // 결과 로그 출력 (code: 0이면 성공, 그 외 실패)
            console.log('[Aligo] 응답 결과:', JSON.stringify(result));
            return result;
        } catch (error) {
            console.error('[Aligo] 라이브러리 호출 중 에러:', error);
            return {
                code: -999,
                message: 'aligoapi library error'
            };
        }
    }

    /**
     * 오프라인 상태 알림 발송 (UE_0257)
     * 템플릿: #{address}에 설치된 설비 #{name}가 #{time} OFF라인 상태이니 확인 바랍니다.
     */
    public async sendOfflineAlert(
        receiverPhone: string, 
        address: string, 
        deviceName: string, 
        timeString: string
    ): Promise<AligoResponse> {
        const message = `${address}에 설치된 설비 ${deviceName}가 ${timeString} OFF라인 상태이니 확인 바랍니다.`;
        
        return await this.sendAlimTalk({
            receiver: receiverPhone,
            tpl_code: TPL_CODES.OFFLINE,
            subject: '장비 오프라인 알림',
            message: message,
            failover: 'Y',
            fsubject: '장비 오프라인 알림',
            fmessage: message
        });
    }

    /**
     * 배터리 상태 알림 발송 (UE_0258)
     * 템플릿: #{address}에 설치된 설비 #{name}가 #{time} 배터리 잔량이 #{battery}% 이하이니 확인 바랍니다.
     */
    public async sendBatteryAlert(
        receiverPhone: string, 
        address: string, 
        deviceName: string, 
        timeString: string, 
        batteryLevel: number
    ): Promise<AligoResponse> {
        const message = `${address}에 설치된 설비 ${deviceName}가 ${timeString} 배터리 잔량이 ${batteryLevel}% 이하이니 확인 바랍니다.`;

        return await this.sendAlimTalk({
            receiver: receiverPhone,
            tpl_code: TPL_CODES.BATTERY,
            subject: '배터리 부족 알림',
            message: message,
            failover: 'Y',
            fsubject: '배터리 부족 알림',
            fmessage: message
        });
    }

    /**
     * 채집 상태 알림 발송 (UE_0259)
     * 템플릿: #{address}에 설치된 설비 #{name}가 #{time} 시간당 #{count}마리 이상 채집이 되었으니 확인 바랍니다.
     */
    public async sendCollectionAlert(
        receiverPhone: string, 
        address: string, 
        deviceName: string, 
        timeString: string, 
        count: number
    ): Promise<AligoResponse> {
        const message = `${address}에 설치된 설비 ${deviceName}가 ${timeString} 시간당 ${count}마리 이상 채집이 되었으니 확인 바랍니다.`;

        return await this.sendAlimTalk({
            receiver: receiverPhone,
            tpl_code: TPL_CODES.COLLECTION,
            subject: '대량 채집 알림',
            message: message,
            failover: 'Y',
            fsubject: '대량 채집 알림',
            fmessage: message
        });
    }
}