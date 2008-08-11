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

function isArray(testObject) {   
  return testObject && !(testObject.propertyIsEnumerable('length')) && typeof testObject === 'object' && typeof testObject.length === 'number';
}
var Validator = {
  validation_messages: { validates_presence_of: 'should not be empty', 
                         validates_format_of: 'is in wrong format',
                         validates_email_format_of: 'is not valid e-mail address',
                         validates_with_function: 'did not pass custom validation'},
  validate: function(model, validator)
  {
    this.messages = {};
    this.validations = [];
    this._setup_validations(model, validator);
    for(v in this.validations)
    {
      try
      {
        if(typeof(model[this.validations[v][0]]) == 'function')
        {
          validation = model[this.validations[v][0]](this.validations[v][2], this.validations[v][1]);
          if(validation !== true)
          {
            if(typeof(this.validations[v][1].message) != 'undefined')
              this._add_error_message(this.validations[v][2], this.validations[v][1].message);
            else
              this._add_error_message(this.validations[v][2], this._error_message_For(this.validations[v][0]));
          }
        }
        else
          throw('There is no validation named ' + this.validations[v][0])
      }
      catch(e){
        //console.log(e)
      }
    }
    
    //console.log(this.messages)
    return this.messages
  },
  _setup_validations: function(model, validator)
  {
    for(f in this.validators)
    {
      model[f] = this.validators[f];
    }
    for(var v in validator)
    {
      validation_options = validator[v]
      if(isArray(validation_options))
      {
        for(i in validation_options)
        {
          if(typeof(validation_options[i]) == 'string')
          {
            this._add_validation_to_object(validation_options[i], v, {});
          }
          else
          {
            fields = validation_options[i].fields
            args = validation_options[i];
            delete(args.fields);
            if(isArray(fields))
            {
              for(j in fields)
              {
                this._add_validation_to_object(fields[j], v, args)
              }
            }
            else
            {
              this._add_validation_to_object(fields, v, args)
            }
          }
        }
      }
      else if(typeof(validation_options) == 'string')
      {
        this._add_validation_to_object(validation_options, v, {})
      }
      else
      {
        fields = validation_options.fields;
        args = validation_options;
        delete(args.fields);
        if(isArray(fields))
        {
          for(j in fields)
          {
            this._add_validation_to_object(fields[j], v, args)
          }
        }
        else
        {
          this._add_validation_to_object(fields, v, args)
        }
      }
    }
  },
  _add_validation_to_object: function(field, validation, args)
  {
    this.validations.push([validation, args, field])
  },
  add_validator: function(validator_name, f, message)
  {
    try
    {
      if(typeof(this.validators[validator_name]) == 'undefined')
      {            
        this.validators[validator_name] = f;
        this.add_validation_message(validator_name, message)
      }
      else
      {
        throw("You can't overwrite built in validator")
      }
    }
    catch(e)
    {
      //console.log(e)
    }
  },
  
  validators: {
    validates_presence_of: function(field, args)
    {
      if(this[field] == null || this[field] == '')
        return false;
      return true;
    },
    validates_format_of: function(field, args)
    {
      return args.with.test(this[field])
    },
    validates_email_format_of: function(field, args)
    {
      args.with = /^([a-zA-Z0-9])+([\.a-zA-Z0-9_-])*@([a-zA-Z0-9])+(\.[a-zA-Z0-9_-]+)+$/;
      return this.validates_format_of(field, args);
    },
    validates_with_function: function(field, args)
    {
      return args.with.call(this, field, args);
    }
  },
  add_validation_message: function(validator_name, message){
    this.validation_messages[validator_name] = message;
  },
  _error_message_For: function(v){
    if(typeof(this.validation_messages[v]) != 'undefined')
      return this.validation_messages[v];
    else
      return v + ' failed';
  },
  _add_error_message: function(field, message)
  {
    if(typeof(this.messages[field]) == 'undefined')
      this.messages[field] = [];
    this.messages[field].push(message);
  }
}

Validator.add_validator('validates_test', function(field, args){return false;}, 'Custom named validator message');

var validator_scheme = {
  validates_presence_of: ['title', 'lead'],
  validates_format_of: {fields: 'title', with: /Homer|Marge|Bart|Lisa|Maggie/},
  validates_with_function: [{fields: ['lead', 'email'], with: function(field, args){
                                                    if(this.validates_presence_of(field, args))
                                                      return this.validates_email_format_of(field, args);
                                                    return true;
                                                  }, message: 'Custom validation message'},
                            {fields: 'title', with: function(args){return false}}],
  validates_test: 'title'
};
var validating_object = {title: 'Homer', lead: '', email: 'test@mail.com'};

Validator.validate(validating_object, validator_scheme);