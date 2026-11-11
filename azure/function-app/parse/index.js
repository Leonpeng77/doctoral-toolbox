'use strict';
const { handleParse } = require('../shared/handler');

module.exports = async function (context, req) {
  const result = handleParse(req && req.body ? req.body : {});
  context.res = {
    status: result.statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: result.body
  };
};
