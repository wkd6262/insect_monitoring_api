import { createLogger, config, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import configData from '../config';

//로그 저장할 방식을 지정한다. 
const transportsList = [];
transportsList.push(
  new transports.DailyRotateFile({ //http 레벨 로그를 저장할 파일 설정.
    level: 'http',
    filename : 'log/' + configData.name + '/%DATE%-system_http.log', // log 폴더에 system.log 이름으로 저장
    zippedArchive: true, // 압축여부
    datePattern: "YYYY-MM-DD",
    maxSize: "500m", //최대 500메가.
    maxFiles: "90d", //maxSize를 초과할 경우 최대 10개 파일까지 만든다.
  })
);

transportsList.push(
  new transports.DailyRotateFile({ //info 레벨 로그를 저장할 파일 설정.
    level: 'info',
    filename : 'log/' + configData.name + '/%DATE%-system.log', // log 폴더에 system.log 이름으로 저장
    zippedArchive: true, // 압축여부
    datePattern: "YYYY-MM-DD",
    maxSize: "500m", //최대 500메가.
    maxFiles: "90d", //maxSize를 초과할 경우 최대 10개 파일까지 만든다.
  })
);

transportsList.push(
  new transports.DailyRotateFile({ //info 레벨 로그를 저장할 파일 설정.
    level: 'error',
    filename : 'log/' + configData.name + '/%DATE%-system_error.log', // log 폴더에 system.log 이름으로 저장
    zippedArchive: true, // 압축여부
    datePattern: "YYYY-MM-DD",
    maxSize: "500m", //최대 500메가.
    maxFiles: "90d", //maxSize를 초과할 경우 최대 10개 파일까지 만든다.
  })
);

if(process.env.NODE_ENV !== 'production') {
  transportsList.push(
    new transports.Console({
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.cli(),
        format.splat(),
      )
    })
  )
}

const LoggerInstance = createLogger({
  level: 'custom',
  levels: config.npm.levels,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: transportsList
});

export default LoggerInstance;