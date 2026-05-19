import { Router, Request, Response } from 'express';
import { verifyToken } from '../authorization';
import { AligoService, AlimTalkRequestData, AligoResponse } from '../services/aligo-service';

const router = Router();

router.use('/send', verifyToken);
router.post('/send', async (request: Request, response: Response) => {
    // #swagger.tags = ['aligo']
    // #swagger.summary = '알리고 알림톡 일반 발송 (관리자 전용)'
    // #swagger.path = '/aligo/send'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        receiver: { type: "string", description: "수신자 전화번호" },
                        tpl_code: { type: "string", description: "템플릿 코드" },
                        subject: { type: "string", description: "제목" },
                        message: { type: "string", description: "메시지 내용" },
                        failover: { type: "string", description: "대체문자 여부 (Y/N)" }
                    },
                    required: ["receiver", "tpl_code", "message"]
                }
            }
        }
    } */
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: { "application/json": { schema: { $ref: '#/components/schemas/AligoSuccessResponse' } } }
     } */
    
    const aligoService = new AligoService();

    try {
        const userLevel: number = response.locals['user_level'];

        if (userLevel !== 1) {
             response.status(400).json({ type: 'error', message: 'not admin level' });
             return;
        }

        // [수정] userid, sender는 받지 않음
        const { receiver, tpl_code, subject, message, failover } = request.body;

        if (!receiver || !tpl_code || !message) {
             response.status(400).json({ type: 'error', message: 'missing required fields' });
             return;
        }

        const requestData: AlimTalkRequestData = {
            receiver: receiver,
            tpl_code: tpl_code,
            subject: subject ?? '알림',
            message: message,
            failover: failover ?? 'Y',
            fsubject: subject,
            fmessage: message
        };

        const result: AligoResponse = await aligoService.sendAlimTalk(requestData);

        if (result.code === 0) {
            response.status(200).json(result);
        } else {
            response.status(400).json({ 
                type: 'error', 
                message: result.message,
                code: result.code 
            });
        }
    } catch (err) {
        response.status(400).json({ type: 'error', message: 'unknown server error' });
    }
});

export default router;