# Low Pro JQ

Burrowed heavily from Dan Webb's version from:
* GIT: [github.com:danwrong/low-pro-for-jquery.git](github.com:danwrong/low-pro-for-jquery.git)
* Download: [http://github.com/danwrong/low-pro-for-jquery/tree/master/src/lowpro.jquery.js?raw=true](http://github.com/danwrong/low-pro-for-jquery/tree/master/src/lowpro.jquery.js?raw=true)


## Bind Events
    Event.addBehavior({
      '#div1 a:click': function() {
        $('body').css({backgroundColor: 
        '#'+Math.floor(Math.random()*16777215).toString(16)});
      }
    });

## Bind Elements (based on if the element exists on the page)

    Event.addBehavior({
      '#twitter_trends': function() {
        //some code that loads
        //current trends from twitter
      }
    });
    

## Bind to behaviors
    
    var AwesomeBehavior = Behavior.create({
      initialize: function() {
        this.element //the bound element
      },

      onclick: function() {
        alert('clicked');
      }
    });

    Event.addBehavior({
      '#behaviors p': AwesomeBehavior
    })
    
## Event delegation (binding events to elements that may be loaded in later)

    var AwesomeDelegator = Behavior.create({
      onmouseover: $.delegate({
        '#twitter_trends p': function(element, event) {
          $(element).css({backgroundColor: '#c0c0c0'});
        }
      })
    });

    Event.addBehavior({
      'body': AwesomeDelegator
    })
    
Check out demo.html for examples.
