import Koa from 'koa';
const app = new Koa();
import bodyParser from 'koa-bodyparser';
import koaRouter from 'koa-router';
const router  = koaRouter();
import redisConn from '../listener-libs/redisConn';
import oauth from './controllers/oauth';
import {auth,authScope,authChannel} from '../listener-libs/auth';
import koaValidate from 'koa-validate';
koaValidate(app);
app.use(bodyParser({
  onerror: function (err, ctx){
    logger.warn(err);
    ctx.status=422;
    ctx.body = {
      ...config.errors.invalid_params,
      errors:[
        {'body':'body parse error'}
      ]
    }
  }
}));

router.all('*',async function (ctx, next) {
  ctx.set ({
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods":"POST,GET,HEAD,DELETE,PUT,PATCH"
  });
  await next();
});

router.get('/authorize',async (ctx)=>{
  await send(ctx,'./static/authorize.html');
});

router.get('/oauth2',auth,(ctx) => {
  // ctx.body =  config.redisPrefix;
  ctx.body = ctx.headers;
});
router.post('/oauth2/decision',auth,oauth.postDecision);
router.delete('/oauth2/decision',auth,oauth.delDecision);
router.post('/oauth2/access_token',authChannel,oauth.token);

app.use(router.routes())
.use(router.allowedMethods({
  throw:true
}));

app.listen(3001);
app.on('error',err => {
  logger.error(err);
});
