//import faunadb from 'faunadb';

const handler = async (event, context) => {
    let params = event.queryStringParameters;
    console.log('hello world',params)
    const {
        // this magic documented here:
        // https://www.gatsbyjs.org/blog/2018-12-17-turning-the-static-dynamic/#bonus-points-authenticated-lambda-functions-for-your-gatsby-app
        user, // actual user info you can use for your serverless functions
    } = context.clientContext
    return {
        statusCode:200,
        body:`Params: ${JSON.stringify(params)} and user ${JSON.stringify(user)}`
    }
}

console.log('hello world');

exports.handler = handler;
