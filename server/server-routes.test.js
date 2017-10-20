const expect  = require('expect');
const request = require('supertest');
const app = require('./server').app;

function test(a, b) {
    return a + b;
}
describe('test suite', () => {
    it('should return a test result', ()=>{
        expect(test(3, 2)).toBe(5);
    });

    it('should return hello world line', (done) => {
        request(app)
            .get('/test')
            .expect(200)
            .expect('hello world')
            .end(done);
    });
});
