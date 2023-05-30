import * as vscode from 'vscode';


import axios, { AxiosError } from 'axios'
import { encode } from 'gpt-3-encoder';
interface OpenAIResponse {
    role: string;
    content: string;
}
const messages: { role: string; content: string }[] = []
export async function callOpenAI(text: string): Promise<OpenAIResponse | undefined> {
    const token = vscode.workspace.getConfiguration('UsefulCode').token; 
    if(!token) {
        vscode.window.showErrorMessage('请先设置OpenAI的Token');
        return;
    }
    try {
        messages.push({"role": "user", "content": text})

        const str = messages.map(m => m.content).join('\n')
        const encodedLength = countTokens(str)
        if(encodedLength > 4000 && messages.length == 1) {
            vscode.window.showErrorMessage('输入的文本过长');
            return;
        }


        // 限制最多12条消息，最多3072个token 或者 8条消息且最多3072个token
        if((messages.length > 8 && encodedLength > 3072)  || encodedLength > 3072 || messages.length > 12) {
            messages.shift()
        }

        console.log(messages, encodedLength)


        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.2,
        },{
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        messages.push({"role": "assistant", "content": response.data.choices[0].message.content})
        return response.data.choices[0].message;
    } catch (error) {
        const e = error as AxiosError;
        if(e.response?.status == 401){
            vscode.window.showErrorMessage('OpenAI调用失败，请检查Token是否正确');
        }else{
            vscode.window.showErrorMessage('OpenAI调用失败');
        }
        console.log(error);
    }
}

// 计算token数量
function countTokens(text: string) {
    return encode(text).length
}
            
