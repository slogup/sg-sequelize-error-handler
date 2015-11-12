var bodyGenderator = function (err, code) {
    var body = [];
    for (var k in err.errors) {
        var elem = {
            param: err.errors[k].path,
            value: err.errors[k].value,
            code: code + ''
        };
        body.push(elem);
    }
    return {
        status: code,
        body: body
    };
};

var refine = function (err) {
    if (err.name == "SequelizeValidationError") {
        return bodyGenderator(err, 501);
    } else if (err.name == "SequelizeUniqueConstraintError") {
        return bodyGenderator(err, 409);
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
        var refinedError = refine(err);
        if (callback) callback(refinedError.status, refinedError.body);
    };
};

var catchLocalCallback = function (req, res, next) {
    return function (err) {
        err = refine(err);
        res.hjson(req, next, err.status, err.body);
    };
};

var nodeifyCallback = function (loadedData, callback) {
    return function (err) {
        if (!loadedData) return callback(404);
        if (err) {
            var refinedError = refine(err);
            if (callback) callback(refinedError.status, refinedError.body);
        } else {
            if (callback) callback(200, loadedData);
        }
    };
};

module.exports.refine = refine;
module.exports.catchCallback = catchCallback;
module.exports.nodeifyCallback = nodeifyCallback;
module.exports.catchLocalCallback = catchLocalCallback;

module.exports.connect = function () {
    return function (req, res, next) {
        req.sequeCatch = catchLocalCallback;
        req.refineSequeError = refine;
        next();
    };
};