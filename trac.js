const url ="http://localhost:8090/fdb/ssbd/amc/transact";

// Function to generate a random string for collection names
function generateRandomString(length = 8) {
    return Math.random().toString(36).substring(2, length + 2);
}

// Function to create a transaction query with random collection name
function createTransactionQuery(index) {
    return [{
        "_id": "_collection",
        "name": `test_${generateRandomString()}_${index}`
    }];
}

// Function to send a single transaction
async function sendTransaction(index) {
    const query = createTransactionQuery(index);
    const opt = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
    };

    try {
        const response = await fetch(url, opt);
        const result = await response.json();
        return {
            success: true,
            index,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            index,
            error: error.message
        };
    }
}
export {
    sendTransaction
}