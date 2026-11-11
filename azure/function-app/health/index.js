'use strict';
const { handleHealth } = require('../shared/handler');

module.exports = async function (context) {
  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: { ...handleHealth(), mode: 'azure' }
  };
};
