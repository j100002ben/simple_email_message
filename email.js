var crypto  = require('crypto');

function EmailBlock() {
    this.headers = {};
    this.data = '';
    this.multipart = false;
    this.content_type = '';
    this.blocks = [];
}
EmailBlock.prototype.setHeader = function(name, value){
    this.headers[name] = value;
};
EmailBlock.prototype.setData = function(data){
    this.data = data;
};
EmailBlock.prototype.addBlock = function(block){
    this.blocks.push(block);
};
EmailBlock.prototype.setContentType = function(content_type){
    this.content_type = content_type;
};
EmailBlock.prototype.setMultipart = function(flag){
    this.multipart = !!flag;
};
EmailBlock.prototype.build = function(){
    if (this.multipart) {
        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        this.boundary = '---' + crypto.createHash('sha1').update(current_date + random).digest('hex');
    }
};
EmailBlock.prototype.getHeader = function(){
    if (this.multipart) {
        this.setHeader('Content-Type', this.content_type + '; boundary="' + this.boundary + '"');
    } else {
        this.setHeader('Content-Type', this.content_type);
    }
    var headers = [];
    var _headers = this.headers;
    Object.keys(_headers).forEach(function(key) {
        headers.push(key + ': ' + _headers[key]);
    });
    return headers.join("\r\n") + "\r\n";
};
EmailBlock.prototype.getBody = function(){
    if (this.multipart) {
        var blocks = [];
        var _blocks = this.blocks;
        for(var i=0; i<_blocks.length; i++) {
            blocks.push(_blocks[i].getRaw());
        }
        return '--' + this.boundary + "\r\n" + 
            blocks.join("\r\n--" + this.boundary + "\r\n") + 
            "\r\n--" + this.boundary + "--";
    } else {
        return this.data;
    }
};
EmailBlock.prototype.getRaw = function(){
    this.build();
    return this.getHeader() + "\r\n" + this.getBody() + "\r\n";
};

function EmailMessage() {
    EmailBlock.call(this);
}
EmailMessage.prototype = Object.create(EmailBlock.prototype);
EmailMessage.prototype.constructor = EmailMessage;
EmailMessage.prototype.setForm = function(from){
    this.setHeader('From', from);
};
EmailMessage.prototype.setTo = function(to){
    this.setHeader('To', to);
};
EmailMessage.prototype.setBcc = function(bcc){
    this.setHeader('Bcc', bcc);
};
EmailMessage.prototype.setReplyTo = function(reply_to){
    this.setHeader('Reply-To', reply_to);
};
EmailMessage.prototype.setSubject = function(subject){
    this.setHeader('Subject', '=?utf-8?B?' + new Buffer(subject).toString('base64') + '?=');
};

function simple_block(content_type, charset, data) {
    var e = new EmailBlock();
    e.setContentType(content_type + '; charset="' + charset + '"');
    e.setHeader('Content-Disposition', 'inline');
    e.setHeader('Content-Transfer-Encoding', 'base64');
    e.setData(new Buffer(data).toString('base64'));
    return e;
}
function attachment_block(content_type, name, cid, data) {
    var e = new EmailBlock();
    e.setHeader('Content-Disposition', 'inline');
    e.setHeader('Content-Transfer-Encoding', 'base64');
    if (!!cid) {
        e.setHeader('Content-ID', '<' + cid + '>');
    }
    if (!!name) {
        e.setContentType(content_type + '; name="' + name + '"');
        e.setHeader('Content-Location', name);
    } else {
        e.setContentType(content_type);
    }
    e.setData(data);
    return e;
}
