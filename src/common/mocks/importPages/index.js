import glob from 'glob';
import fs from 'fs';
import path from 'path';
const filenames = glob.sync('src/common/mocks/importPages/*.html');
export const files = {};
console.log('index sees',filenames);
filenames.forEach((fn)=>{
    files[path.basename(fn)] = fs.readFileSync(fn,'utf8')
});

export {filenames}
                  
    
