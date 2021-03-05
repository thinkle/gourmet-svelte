import {getNutrientInfoRequest,
    queryNutrientRequest     
    } from '../requests/index.js';
import querystring from 'querystring';
import fetch from 'node-fetch';

const API_KEY = process.env.USDA_KEY

queryNutrientRequest.setRequestHandler(
    async (u,params) => {
        let qs = querystring.encode({query:params.query,api_key:API_KEY})
        console.log('QUERY! ',`https://api.nal.usda.gov/fdc/v1/foods/search?${qs}`)
        let response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?${qs}`
        )
        let result = await response.json()
        //console.log('got result',result)
        return result
    }
)

getNutrientInfoRequest.setRequestHandler(
    async (u,params) => {
        console.log('ID=',params.id)
        let qs = querystring.encode({api_key:API_KEY})
        let response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/food/${params.id}?${qs}`
        )
        let result = await response.json();
        return {
            id:params.id,
            result,
            key:API_KEY
        }
    }
)