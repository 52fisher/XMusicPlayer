const fetchData = (url, postData = {}, callback) => {
    fetch(url, postData ? {
         method: 'POST',
         body: JSON.stringify(postData),
         headers: {
             'Content-Type': 'application/json',
         }
     } : {
         method: 'GET',
     }
     ).then(res => res.json()).then(res => {
         callback && callback(res)
     })
 }
export default fetchData;