import jestFetchMocks from 'jest-fetch-mock'
import {handler} from './api.js';
import querystring from 'querystring'
import {jsonConcisify} from '../../utils/textUtils.js';

export function mockLambdaFunction (user) {

    let context = {
        clientContext : {
            user : user
        }
    }

    fetch.mockResponse(
        async (request)=>{
            if (request.url.indexOf('getR')>-1) {
                debugger;
            }
            request.queryStringParameters = querystring.parse(request.url.split('?')[1])
            let response = await handler(request,context)
            response.status = response.statusCode
            // console.log('Response to ',
            //             request.url,
            //             request.queryStringParameters,
            //             jsonConcisify(response)
            //            )
            return response;
        }
    );
}

function snippet (obj) {
    let s = JSON.stringify(obj);
    if (s.length < 53) {
        return s.substr(0,50)+'...'
    }
    else {
        return s.substr(0,53)
    }
}
