const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");


const app = express();

app.set('view engine', 'ejs');

mongoose.connect(`mongodb+srv://Giorgio:${process.env.OPEN_PASSWORD}@cluster0.tu3o0b2.mongodb.net/todolistDB`,{useNewUrlParser: true})
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});

const schemaItems = ({
    name: String
})

const Items = mongoose.model("Item", schemaItems);

const item1 = new Items({
    name: "Welcome to your todolist!"
})
const item2 = new Items({
    name: "Hit the + button to add item"
})
const item3 = new Items({
    name: "<-- hit this to delete item"
})

const defaultItems = [item1,item2,item3];

const ListSchema = ({
    name: String,
    items: [schemaItems]
})

const List = mongoose.model("List", ListSchema);


app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/",function(req, res){
    let day = date.getDate();

    Items.find({})
    .then((foundItem)=>{

        let lenght = foundItem.length;

        if (lenght === 0){
            Items.insertMany(defaultItems)
             .then((docs) => {
                  console.log("Default items inserted successfully:", docs);
              })
              .catch((err) => {
                  console.error("Error inserting default items:", err);
              });
            res.redirect("/");  
        }else{
            res.render("list", {listTitle: day,lenGht: lenght, newListItem: foundItem});
        }
    })
    .catch((err)=>{
        console.error(err)
    });

})
app.post("/",function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list || date.getDate();;

   

    const item = new Items({
        name: itemName
    });
    if(listName === date.getDate()){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name:listName})
        .then((foundList)=>{

            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        })
        .catch((err)=>{
            console.error(err)
        });
    }

})

app.post("/delete",(req,res)=>{
   const checkedItemId = req.body.checkbox;
   const listName = req.body.listName;

   if(listName === date.getDate()){

      Items.findByIdAndRemove(checkedItemId)
      .then((docs)=>{
         console.log("it successfully deleted item!")
      })
      .catch((err)=>{
         console.error(err)
      });
    
      res.redirect("/");
   }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id: checkedItemId}}})
    .then((docs)=>{
        if(docs){
            res.redirect("/"+listName);
        }
    })
    .catch((err)=>{
        console.error(err)
    })
   }
})
app.get("/:customListName",function(req,res){

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name:customListName})
    .then((findlist)=>{
        if(!findlist){
            const list = new List({
                name: customListName,
                items: defaultItems
            });
        
            list.save();
            res.redirect("/"+ customListName);
        }else{
            const lenghtTwo = findlist.items.length;
             res.render("list", {listTitle: findlist.name,lenGht: lenghtTwo, newListItem: findlist.items})
        }
    })
    .catch((err)=>{
        console.error(err)
    });
})
app.get("/about", function(req,res){
    res.render("about");
})
app.listen(process.env.PORT || 3000,function(){
    console.log("The server running on a port 3000");
})
  