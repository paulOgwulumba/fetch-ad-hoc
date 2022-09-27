import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...

/**
 * @description This creates the search object to be passed as a query to the 'records' endpoint.
 * @param {*} page The page number to fetch.
 * @param {*} colors The colors to fetch.
 * @returns Search object.
 */
function createSearchObject(page = 1, colors = []) {
    let searchObject = {};
    searchObject.limit = 10;
    searchObject.offset = (page - 1) * 10;

    if (colors.length > 0) {
        searchObject['color[]'] = colors;
    }

    return searchObject;
}

/**
 * @description This returns an array of the id's of all the records returned by the 'records' endpoint.
 * @param {*} data Records returned by 'records' endpoint.
 * @returns An array of id's.
 */
function extractIDs (data = [{ id: 1, color: "brown", disposition: "closed" }]) {
    return data.map((item) => item.id);
}

/**
 * @description Returns true if a given color is a primary color and false if not.
 * @param {*} color Color to be checked.
 * @returns true for a primary color and false for a non-primary color.
 */
function isPrimaryColor (color = 'red') {
    color = color.toLowerCase();

    return (color === 'red' || color === 'yellow' || color === 'blue')
}

/**
 * @description This filters a list of records and returns only the records whose disposition is 'open'.
 * @param {*} data Records to be filtered.
 * @returns A filtered array.
 */
function extractOpenData (data = [{ id: 1, color: "brown", disposition: "closed" }]) {
    const openData = data.filter((item) => item.disposition === 'open');

    return openData.map((item) => {
        return {
            ...item,
            isPrimary: isPrimaryColor(item.color)
        }
    })
}

/**
 * @description This returns the total number of records whose disposition is 'closed'
 * @param {*} data Records to be investigated.
 * @returns Total number of 'closed' records.
 */
function calculateClosedPrimaryCount (data = [{ id: 1, color: "brown", disposition: "closed" }]) {
    return data.filter((item) => (item.disposition === 'closed') && (isPrimaryColor(item.color))).length;
}

/**
 * @description This packages the data gotten from the 'records' endpoint into the format to be returned to an end user.
 * @param {*} data Records gotten from 'records' endpoint.
 * @param {*} page Page number fetched.
 * @returns Packaged data.
 */
function transformData (data = [{ id: 1, color: "brown", disposition: "closed" }], page = 1) {
    const ids = extractIDs(data);

    const transformedData = {
        ids: ids,
        open: extractOpenData(data),
        closedPrimaryCount: calculateClosedPrimaryCount(data),
        previousPage: page <= 1? null : page - 1,
        nextPage: page >= 50 || ids.length < 10? null : page + 1,
    };

    return transformedData;
}

async function retrieve (options) {
    const { page = 1 , colors = [] } = options || { page: 1 };
    const searchObject = createSearchObject(page, colors);

    const requestUrl = URI('http://localhost:3000/records').search(searchObject);

    let resolvePromise;
    let rejectPromise;

    const promise = new Promise((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    })

    fetch(requestUrl)
        .then((response) => {
            if(!response.ok) {
                throw new Error('Network response was not OK');
            }

            return response.json();
        })
        .then((data) => {
            const transformedData = transformData(data, page);

            resolvePromise(transformedData);
        })
        .catch((error) => {
            console.log('An error occurred while processing your request.');
            rejectPromise('An error occurred while processing your request');
        })
    
    return await promise;
}

export default retrieve;
