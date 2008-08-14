/*
Copyright (c) 2008, Mihael Konjević

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

var Validator = function(subject, validation_schema){
  this.subject = subject;
  this.validations = {};
  this.setup_validations(validation_schema);
};
Validator.prototype.validate = function(){
  error_messages = {};
  for(field in this.validations)
  {
    result = this.validate_field(field)
    if(result != true)
      error_messages[field] = result;
  }
  return error_messages;
}
Validator.prototype.validate_field = function(field){
  this.subject._validate = function(validator, field, args){
    return Validator.validators[validator].call(this, field, args);
  }
  field_validations = this.validations[field];
  error_messages_for_field = [];
  for(i in field_validations)
  {
    if(i != '_type')
    {
      if(typeof(field_validations[i].args) != 'undefined')
        custom_message = field_validations[i]['args']['message'];
      if(!this.validate_field_with_validator(field_validations[i]['validator'], field, field_validations[i]['args']))
      {
        if(typeof(custom_message) == 'undefined')
          error_messages_for_field.push(Validator.error_messages[field_validations[i]['validator']]);
        else
          error_messages_for_field.push(custom_message);
      }
    }
  }
  delete this.subject._validate;
  if(error_messages_for_field.length == 0)
    return true;
  return error_messages_for_field;
}
Validator.prototype.validate_field_with_validator = function(validator, field, args){
  return Validator.validators[validator].call(this.subject, field, args);
}
Validator.prototype.setup_validations = function(validation_schema)
{
  for(var v in validation_schema)
  {
    validation_options = validation_schema[v];
    if(Validator.utils.isArray(validation_options))
    {
      for(i in validation_options)
      {
        if(i !== '_type')
        {
          if(Validator.utils.isString(validation_options[i]))
            this.add_validation_for_subject(validation_options[i], v, {});
          else
          {
            fields = validation_options[i].fields;
            args = validation_options[i];
            delete(args.fields);
            if(Validator.utils.isArray(fields))
              for(j in fields)
              {
                if(j != '_type')
                  this.add_validation_for_subject(fields[j], v, args);
              }
            else
              this.add_validation_for_subject(fields, v, args);
          }
        }
      }
    }
    else if(Validator.utils.isString(validation_options))
      this.add_validation_for_subject(validation_options, v, {});
    else
    {
      fields = validation_options.fields;
      args = validation_options;
      delete(args.fields);
      if(Validator.utils.isArray(fields))
        for(j in fields)
        {
          this.add_validation_for_subject(fields[j], v, args);
        }
      else
        this.add_validation_for_subject(fields, v, args);
    }
  }
}
Validator.prototype.add_validation_for_subject = function(field, validator, args)
{
  if(typeof(this.validations[field]) == 'undefined')
    this.validations[field] = [];
  return this.validations[field].push({validator: validator, args: args})
}
Validator.add_validator = function(validator_name, validator_function, validator_error_message){
  Validator.validators[validator_name] = validator_function;
  Validator.error_messages[validator_name] = validator_error_message;
}
Validator.utils = {
  isArray: function(testObject) {   
    return testObject && !(testObject.propertyIsEnumerable('length')) && typeof testObject === 'object' && typeof testObject.length === 'number';
  },
  isString: function(testObject) {
    return !!arguments.length && testObject != null && (typeof testObject == "string" || testObject instanceof String)
  }
}
Validator.error_messages = { presence_of     : 'should not be empty', 
                             format_of       : 'is in wrong format',
                             email_format_of : 'is not valid e-mail address',
                             with_function   : 'did not pass custom validation' };
Validator.validators = { presence_of: function(field, args){
                            if(typeof(this[field]) == 'undefined' || this[field] == null || this[field] == '')
                              return false;
                            return true;
                          },
                          format_of: function(field, args){
                            return args.with.test(this[field])
                          },
                          email_format_of: function(field, args){
                            args.with = /^([a-zA-Z0-9])+([\.a-zA-Z0-9_-])*@([a-zA-Z0-9])+(\.[a-zA-Z0-9_-]+)+$/;
                            return this._validate('format_of', field, args);
                          },
                          with_function: function(field, args){
                            return args.with.call(this, field, args);
                          }};