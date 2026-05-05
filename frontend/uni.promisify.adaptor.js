if (typeof uni !== 'undefined' && typeof uni.addInterceptor === 'function') {
  uni.addInterceptor({
    returnValue(res) {
      if (!res || typeof res !== 'object' || typeof res.then !== 'function') {
        return res;
      }

      return new Promise((resolve, reject) => {
        res.then((result) => {
          if (result && result[0]) {
            reject(result[0]);
            return;
          }
          resolve(result ? result[1] : result);
        });
      });
    }
  });
}
