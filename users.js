const fs = require('fs');

const readData = () => {
    try {
        const data = fs.readFileSync("./data.json");
        return JSON.parse(data);
    } catch (error) {
        console.error('The file does not exist');
        return [];
    }
};

const writeData = (data) => {
    fs.writeFile('./data.json', JSON.stringify(data, null, 4), (err) => { if (err) throw err; });
};


module.exports.readData = readData;
module.exports.writeData = writeData;