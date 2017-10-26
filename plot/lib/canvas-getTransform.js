// a js tool to record the canvas transformation
function getTransform(ctx) {
  const translate = ctx.translate.bind(ctx);
  const scale = ctx.scale.bind(ctx);
  const rotate = ctx.rotate.bind(ctx);
  const setTransform = ctx.setTransform.bind(ctx);
  const save = ctx.save.bind(ctx);
  const restore = ctx.restore.bind(ctx);
  // record transforms
  let curTrans = [1, 0, 0, 1, 0, 0];
  const transStack = [];
  const Pos = {
    tx: 4,
    ty: 5,
    sx: 0,
    sy: 3,
    rx: 1,
    ry: 2
  }
  // proxy ctx transform
  ctx.translate = function (x, y) {
    curTrans[Pos.tx] += x;
    curTrans[Pos.ty] += y;
    translate(x, y);
  }

  ctx.rotate = function (radian) {
    curTrans[Pos.rx] += radian;
    rotate(radian);
  }

  ctx.scale = function (x, y) {
    curTrans[Pos.sx] *= x;
    curTrans[Pos.sy] *= y;
    scale(x, y);
  }

  ctx.setTransform = function (a, b, c, d, e, f) {
    curTrans[Pos.sx] = a;
    curTrans[Pos.sy] = d;
    curTrans[Pos.tx] = e;
    curTrans[Pos.ty] = f;
    curTrans[Pos.rx] = b;
    curTrans[Pos.ry] = c;
    setTransform(a, b, c, d, e, f);
  }

  ctx.save = function () {
    transStack.push(curTrans.slice());
    save();
  }

  ctx.restore = function () {
    if (transStack.length) {
      curTrans = transStack.pop();
    }
    restore();
  }

  ctx.getTransform = function () {
    return curTrans.slice();
  }

}

window.getTransform = window.getTransform || getTransform;