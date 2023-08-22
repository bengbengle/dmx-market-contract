var realFetch = require('node-fetch');

export async function get_nonce(user_address: string) {
    let url = 'https://web.52dao.co/v2/profile/get-nonce?user_address='+ user_address
    const req = await realFetch(url);
    
    const json = await req.json();
    return json.data.nonce;
}
export async function sign() {
    let url = ''

    return ''
}

export async function login(user_address: string, signature: string) {
    // const postData =
    // {
    //     "user_address": "0x5866AA518CF0bBe994CC09bb3c3Bae9290F77840",
    //     "signature": "0x9ce473d1dadf4ffde7e756f9405294423aa9fa00c8841c658843fd55b0af91c3323ee42c58fd54eb1dae728e6d2ffaaa168aeda9bb66252ff6ef04f64a7248501b"
    // }

    let postData = {
        "user_address": user_address,
        "signature": signature
    }
    let url = 'https://web.52dao.co/v2/profile/login'
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
    let url = 'https://web.52dao.co/v2/order/create-order'
    const req = await realFetch(url,
        {
            method: 'POST',
            headers: {
                'authorization': authToken,//'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoxMCwiZXhwIjoxNjkxOTg2MjU3LCJ1c2VyQWRkcmVzcyI6IjB4NTg2NkFBNTE4Q0YwYkJlOTk0Q0MwOWJiM2MzQmFlOTI5MEY3Nzg0MCJ9.2pmfUMmHaNj-5ue7SYxwZoHf6PCq4UugtK3m5fDWRnY',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reqBody)
        })
        console.log('req:', req);
    const res = await req.json();
    return res;
}
