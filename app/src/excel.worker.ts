import {inspect} from './excel';
self.onmessage=async(e)=>{try{self.postMessage({ok:true,value:await inspect(e.data.buffer,e.data.data)});}catch(error){self.postMessage({ok:false,error:(error as Error).message});}};
