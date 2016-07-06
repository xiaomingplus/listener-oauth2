
import appendQuery from 'append-query';
import config from '../../listener-libs/config';
import {generateCode,generateToken} from '../../listener-libs/crypto';
import redisConn from '../../listener-libs/redisConn';
import {isObjectEmpty,time} from 'general-js-utils';
const oauth = {

};

oauth.refresh = function(ctx,next){

};

oauth.token =async function(ctx,next){
  const code = ctx.checkBody('code').notEmpty().value;
  try{
    var codeInfo = await redisConn.hgetall(config.redisPrefix.common.code+config.redisPrefix.common.channel+ctx.channel_id+":"+config.redisPrefix.common.code+code);
  }catch(e){
    ctx.status = 500;
    ctx.body = {
      ...config.errors.internal_server_error,
      errors:[
        e
      ]
    };
    return;
  }

  if(isObjectEmpty(codeInfo)){
    ctx.status = 404;
    ctx.body = {
      ...config.errors.not_found,
      errors:[
        {
          "code":"code is not exist!"
        }
      ]
    };
    return;
  }
  const expire = time()+config.defaultParams.accessTokenExpire;
  try{
    var access_token = await generateToken();
    await redisConn.hmset(config.redisPrefix.hash.accessTokenByToken+access_token,{
      scope:codeInfo.scope,
      user_id:codeInfo.user_id
    });
    await redisConn.expireat(config.redisPrefix.hash.accessTokenByToken+access_token,expire);
    await redisConn.del(config.redisPrefix.common.code+config.redisPrefix.common.channel+ctx.channel_id+":"+config.redisPrefix.common.code+code);
  }catch(e){
    console.log(e);
    ctx.status = 500;
    ctx.body = {
      ...config.errors.internal_server_error,
      errors:[
        e
      ]
    };
    return;
  }
  ctx.status = 201;
ctx.body={
  scope:codeInfo.scope,
  user_id:codeInfo.user_id,
  access_token:access_token,
  expire_at:expire
}

}

oauth.postDecision = async function(ctx,next){
  const redirect_uri = ctx.checkBody('redirect_uri').notEmpty().isUrl().value;
  const state = ctx.checkBody('state').optional().value;
  const channel_id = ctx.checkBody('channel_id').notEmpty().value;
  const scope = ctx.checkBody('scope').notEmpty().value;
  if(ctx.errors){
    ctx.status=422;
    ctx.body = {
      ...config.errors.invalid_params,
      errors:ctx.errors
    };
    return;
  }


  const expire = time()+config.defaultParams.codeExpire;
  try{
    var code = await generateCode();
    await redisConn.hmset(config.redisPrefix.common.code+config.redisPrefix.common.channel+channel_id+":"+config.redisPrefix.common.code+code,{
      scope:scope,
      user_id:ctx.userId
    });
    await redisConn.expireat(config.redisPrefix.common.code+config.redisPrefix.common.channel+channel_id+":"+config.redisPrefix.common.code+code,expire);
  }catch(e){
    ctx.status = 500;
    ctx.body = {
      ...config.errors.internal_server_error,
      errors:[
        e
      ]
    };
    return;
  }
ctx.status = 201;
const redirect_uri_result = state?appendQuery(redirect_uri,{
  state:state,
  code:code
}):appendQuery(redirect_uri,{
  code:code
});
ctx.body = {
  redirect_uri:redirect_uri_result,
  code:code
};

};
oauth.delDecision = function(ctx){
  const redirect_uri = ctx.checkBody('redirect_uri').notEmpty().isUrl().value;
  const state = ctx.checkBody('state').optional().value;
  if(ctx.errors){
    ctx.status=422;
    ctx.body = {
      ...config.errors.invalid_params,
      errors:ctx.errors
    };
    return;
  }
ctx.status = 200;
const redirect_uri_result = state?appendQuery(redirect_uri,{
  state:state
}):redirect_uri;
ctx.body = {
  redirect_uri:redirect_uri_result
};
}
export default oauth;
