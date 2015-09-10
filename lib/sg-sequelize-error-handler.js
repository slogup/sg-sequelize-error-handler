var refine = function (err) {
    if (err.name == "SequelizeUniqueConstraintError") {
        var body = [];
        for (var k in err.errors) {
            var elem = {
                param: err.errors[k].path,
                value: err.errors[k].value,
                code: '409'
            };
            body.push(elem);
        }
        return {
            status: 409,
            body: body
        };
    } else if (err.status) {
        return {
            status: err.status,
            body: err.body
        };
    } else {
        return {
            status: 500,
            body: err
        };
    }
};

var catchCallback = function (callback) {
    return function (err) {
        console.error('err', err);
        var refinedError = refine(err);
        if (callback) callback(refinedError.status, refinedError.body);
    };
};

var catchLocalCallback = function (req, res, next) {
    return function (err) {
        console.error('err', err);
        err = refine(err);
        res.hjson(req, next, err.status, err.body);
    };
};

module.exports.catchLocalCallback = catchLocalCallback;
module.exports.refine = refine;
module.exports.catchCallback = catchCallback;

module.exports.connect = function () {
    return function (req, res, next) {
        req.sequeCatch = catchLocalCallback;
        req.refineSequeError = refine;
        next();
    };
};