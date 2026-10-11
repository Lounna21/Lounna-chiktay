// Node.js 20+ server. Environment variables: STRIPE_SECRET_KEY, PUBLIC_BASE_URL, PORT (optional).
// Set STRIPE_WEBHOOK_SECRET to enable verified payment event logging.
const http = require('node:http');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const PORT = Number(process.env.PORT || 3000);
const PRODUCTS = Object.freeze({
 jar12: {name:'Lounna’s Chiktay (12 oz jar)',cents:3000},
 jar32: {name:'Lounna’s Chiktay (32 oz jar)',cents:4000}
});
function json(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
function limitString(v,n){return typeof v==='string'?v.trim().slice(0,n):'';}
function getBody(req){return new Promise((resolve,reject)=>{let chunks=[],size=0;req.on('data',b=>{size+=b.length;if(size>12000){reject(Error('Request too large'));req.destroy();return;}chunks.push(b);});req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject)});}
function stripeRequest(pathname,body){return fetch('https://api.stripe.com/v1'+pathname,{method:'POST',headers:{Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded'},body}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error?.message||'Stripe error');return d;});}
const server=http.createServer(async(req,res)=>{
 const pathOnly=new URL(req.url,'http://localhost').pathname;
 if(req.method==='GET' && (pathOnly==='/'||pathOnly==='/index.html')) {return fs.createReadStream(path.join(__dirname,'index.html')).on('error',()=>json(res,500,{error:'Cannot load store'})).pipe(res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'}));}
 if(req.method==='POST' && pathOnly==='/api/checkout'){
  try {
   if(!process.env.STRIPE_SECRET_KEY || !process.env.PUBLIC_BASE_URL) return json(res,503,{error:'Stripe has not been connected yet. The store owner needs to configure payments.'});
   const base=new URL(process.env.PUBLIC_BASE_URL);if(!['http:','https:'].includes(base.protocol))throw Error('Invalid public URL');
   const data=JSON.parse((await getBody(req)).toString('utf8')); const cart=data.cart;
   if(!cart||typeof cart!=='object'||Array.isArray(cart))return json(res,400,{error:'Invalid basket'});
   const items=Object.entries(cart).map(([id,quantity])=>({id,quantity}));
   if(!items.length||items.length>2||items.some(x=>!PRODUCTS[x.id]||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>50)) return json(res,400,{error:'Invalid cart quantities'});
   const customer=limitString(data.customer,80),phone=limitString(data.phone,25),location=limitString(data.location,160),notes=limitString(data.notes,350),fulfill=data.fulfill;
   if(!customer||!phone||!location||!['Pickup','Delivery request'].includes(fulfill))return json(res,400,{error:'Please enter valid contact and fulfillment details'});
   const params=new URLSearchParams();params.set('mode','payment');
   params.set('success_url',new URL('/?paid=success&session_id={CHECKOUT_SESSION_ID}',base).toString());
   params.set('cancel_url',new URL('/?paid=cancel',base).toString());
   // Stripe captures billing details securely. No card information ever reaches this server.
   params.set('billing_address_collection','auto');params.set('customer_creation','always');params.set('phone_number_collection[enabled]','true');
   const metadata={customer,phone,fulfill,location,notes};
   Object.entries(metadata).forEach(([key,val])=>params.set(`metadata[${key}]`,val));
   items.forEach(({id,quantity},i)=>{const p=PRODUCTS[id];params.set(`line_items[${i}][price_data][currency]`,'usd');params.set(`line_items[${i}][price_data][unit_amount]`,String(p.cents));params.set(`line_items[${i}][price_data][product_data][name]`,p.name);params.set(`line_items[${i}][quantity]`,String(quantity));});
   const session=await stripeRequest('/checkout/sessions',params);return json(res,200,{url:session.url});
  }catch(e){console.error('Checkout error:',e.message);return json(res,400,{error:'Could not start checkout. Please try again.'});}
 }
 // Verify the webhook signature, then handle the checkout.session.completed event.
 if(req.method==='POST' && pathOnly==='/api/stripe-webhook'){
  try {
   if(!process.env.STRIPE_WEBHOOK_SECRET)return json(res,503,{error:'Webhook not configured'});
   const body=await getBody(req), signature=req.headers['stripe-signature']||'';
   const t=/\bt=(\d+)/.exec(signature)?.[1];const signatures=[...signature.matchAll(/\bv1=([a-f0-9]+)/g)].map(x=>x[1]);
   if(!t||Math.abs(Date.now()/1000-Number(t))>300)throw Error('Stale Stripe signature');
   const expected=crypto.createHmac('sha256',process.env.STRIPE_WEBHOOK_SECRET).update(t+'.').update(body).digest('hex');
   if(!signatures.some(s=>s.length===expected.length && crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected))))throw Error('Invalid signature');
   const event=JSON.parse(body.toString('utf8'));
   if(event.type==='checkout.session.completed' && event.data.object.payment_status==='paid'){
    // TODO: Persist order in a database and notify fulfillment staff. Deduplicate by event.id.
    console.log('Paid Stripe checkout session:',event.data.object.id);
   }
   return json(res,200,{received:true});
  }catch(e){console.error('Webhook error:',e.message);return json(res,400,{error:'Invalid webhook'});}
 }
 json(res,404,{error:'Not found'});
});
server.listen(PORT,()=>console.log(`Chiktay store serving on port ${PORT}`));
