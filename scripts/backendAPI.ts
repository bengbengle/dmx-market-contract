var realFetch = require('node-fetch');

// const BACKEND_API = 'https://web.52dao.co/'
const BACKEND_API = 'https://www.daomax.io/'

export async function get_nonce(user_address: string) {
    let url = BACKEND_API + 'v2/profile/get-nonce?user_address=' + user_address
    const req = await realFetch(url);

    const json = await req.json();
    return json.data.nonce;
}

export async function login(user_address: string, signature: string) {
    let postData = {
        "user_address": user_address,
        "signature": signature
    }
    let url = BACKEND_API + 'v2/profile/login'
    const req = await realFetch(url,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        })
    const res = await req.json();
    return res.data.auth_token;
}

export async function listing(authToken: string, reqBody: any) {
    console.log('reqBody:', JSON.stringify(reqBody));
    let url = BACKEND_API + 'v2/order/create-order'
    const req = await realFetch(url,
        {
            method: 'POST',
            headers: {
                'authorization': authToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reqBody)
        })
    console.log('req:', req);
    const res = await req.json();
    console.log('res:', res)
    return res;
}
