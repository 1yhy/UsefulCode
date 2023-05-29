import * as vscode from 'vscode';


import axios from 'axios'
interface OpenAIResponse {
    role: string;
    content: string;
}
export async function callOpenAI(text: string): Promise<OpenAIResponse | undefined> {
    const token = vscode.workspace.getConfiguration('UsefulCode').token;
    if(!token) {
        vscode.window.showErrorMessage('请先设置OpenAI的Token');
        return;
    }
    console.log(token)
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": text}],
            temperature: 0.2,
        },{
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        console.log(response)
        return response.data.choices[0].message;
    } catch (error) {
        vscode.window.showErrorMessage('OpenAI调用失败，请检查Token是否正确');
        console.log(error);
    }
}
            
